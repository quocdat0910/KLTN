import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import json
from datetime import datetime
import logging
import cloudinary
import cloudinary.uploader
from gtts import gTTS
from pydub import AudioSegment
import tempfile
import base64
import time

# Import config
from config import *

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ai_service.log')
    ]
)
logger = logging.getLogger(__name__)

# Load biến môi trường
load_dotenv()

# Khởi tạo Flask app
app = Flask(__name__)
CORS(app)  # Cho phép gọi API từ các domain khác

# Cấu hình Cloudinary
if CLOUDINARY_CLOUD_NAME != 'your_cloudinary_cloud_name':
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )
    logger.info("Đã cấu hình Cloudinary thành công")
else:
    logger.warning("Thiếu cấu hình Cloudinary, audio sẽ không được upload")

# Khởi tạo model và tokenizer local
model = None
tokenizer = None

def initialize_model():
    """Khởi tạo model và tokenizer local"""
    global model, tokenizer
    try:
        logger.info("Đang tải model Gemma-3-1b-it từ local...")
        
        # Sử dụng MODEL_PATH từ config
        model_path = MODEL_PATH
        
        # Cấu hình quantization để tiết kiệm memory
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model với quantization
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            device_map="auto",
            quantization_config=quantization_config,
            trust_remote_code=True
        )
        
        logger.info("Đã tải model Gemma-3-1b-it thành công")
        return True
        
    except Exception as e:
        logger.error(f"Lỗi khi tải model: {str(e)}")
        return False

def generate_text_local(prompt, max_length=512, temperature=0.7, do_sample=True):
    """Sinh text sử dụng model local"""
    try:
        if model is None or tokenizer is None:
            logger.error("Model chưa được khởi tạo")
            return None
        
        # Encode input với attention mask
        encoded = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024, padding=True)
        inputs = encoded['input_ids']
        attention_mask = encoded['attention_mask']
        
        # Move to GPU if available
        device = next(model.parameters()).device
        inputs = inputs.to(device)
        attention_mask = attention_mask.to(device)
        
        # Generate text
        with torch.no_grad():
            outputs = model.generate(
                inputs,
                attention_mask=attention_mask,
                max_length=len(inputs[0]) + max_length,
                temperature=temperature,
                do_sample=do_sample,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.1
            )
        
        # Decode output
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove input prompt from output
        response = generated_text[len(tokenizer.decode(inputs[0], skip_special_tokens=True)):].strip()
        
        return response
        
    except Exception as e:
        logger.error(f"Lỗi khi sinh text: {str(e)}")
        return None

def create_audio_from_text(text, filename="audio"):
    """Tạo audio từ text và upload lên Cloudinary"""
    temp_file = None
    try:
        # Tạo audio từ text
        tts = gTTS(text=text, lang='en', slow=False)
        
        # Lưu tạm thời
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_file.close()  # Đóng file để gTTS có thể ghi
        tts.save(temp_file.name)
        
        # Upload lên Cloudinary
        if cloudinary.config().cloud_name:
            result = cloudinary.uploader.upload(
                temp_file.name,
                resource_type="video",
                folder="placement-test-audio",
                public_id=f"{filename}_{int(time.time())}"
            )
            
            # Xóa file tạm
            try:
                os.unlink(temp_file.name)
            except OSError:
                pass  # Bỏ qua lỗi nếu không xóa được
            
            return result['secure_url']
        else:
            # Nếu không có Cloudinary, trả về base64
            with open(temp_file.name, 'rb') as f:
                audio_data = f.read()
            
            # Xóa file tạm
            try:
                os.unlink(temp_file.name)
            except OSError:
                pass  # Bỏ qua lỗi nếu không xóa được
                
            return f"data:audio/mp3;base64,{base64.b64encode(audio_data).decode()}"
                
    except Exception as e:
        logger.error(f"Lỗi khi tạo audio: {str(e)}")
        # Xóa file tạm nếu có lỗi
        if temp_file:
            try:
                os.unlink(temp_file.name)
            except OSError:
                pass
        return None

def get_fallback_explanation(question_data):
    """Tạo giải thích mẫu khi không thể kết nối API"""
    correct_option = question_data['options'][ord(question_data['correct_answer']) - 65]
    student_option = question_data['options'][ord(question_data['student_answer']) - 65] if question_data['student_answer'] != question_data['correct_answer'] else None
    
    explanations = {
        'green spaces': 'Không gian xanh giúp cải thiện chất lượng không khí, giảm nhiệt độ đô thị và nâng cao sức khỏe tinh thần cho cư dân.',
        'congestion': 'Tắc nghẽn giao thông làm giảm chất lượng sống và tăng ô nhiễm không khí.',
        'noise': 'Ô nhiễm tiếng ồn ảnh hưởng xấu đến sức khỏe tinh thần và thể chất.',
        'construction': 'Xây dựng quá mức có thể dẫn đến mất cân bằng sinh thái đô thị.'
    }
    
    explanation = f"Đáp án đúng là {question_data['correct_answer']} ({correct_option}). {explanations.get(correct_option.lower(), '')}"
    
    if student_option and student_option.lower() in explanations:
        explanation += f"\n\nĐáp án bạn chọn ({question_data['student_answer']}) không tối ưu vì {explanations[student_option.lower()]}"
    
    return explanation

def generate_with_retry(prompt, max_attempts=3):
    """Gọi model local với cơ chế thử lại và fallback"""
    for attempt in range(max_attempts):
        try:
            # Kiểm tra model đã sẵn sàng chưa
            if model is None or tokenizer is None:
                logger.error("Model chưa được khởi tạo")
                return None
                
            response = generate_text_local(prompt, max_length=300, temperature=0.7)
            if response and len(response.strip()) > 0:
                return response.strip()
            else:
                logger.warning(f"Model trả về response rỗng (attempt {attempt + 1})")
        except Exception as e:
            logger.warning(f"Lỗi tạm thời khi gọi model (attempt {attempt + 1}): {str(e)}")
            if attempt < max_attempts - 1:
                time.sleep(1)  # Wait 1 second before retry
            else:
                logger.error(f"Không thể gọi model sau {max_attempts} lần thử")
                return None
    return None

def generate_explanation(question_data):
    try:
        # Tùy chỉnh prompt dựa trên loại câu hỏi
        if question_data['question_type'] == 'true-false':
            is_correct = question_data['student_answer'] == question_data['correct_answer']
            prompt = f"""Hãy giải thích ngắn gọn (1 câu) bằng tiếng Việt TẠI SAO đáp án đúng là {question_data['correct_answer']}.

Câu hỏi: {question_data['question']}

QUAN TRỌNG: Đảm bảo giải thích phù hợp với đáp án đúng {question_data['correct_answer']}.

Giải thích:"""
        else:  # multiple-choice
            options_text = "\n".join([f"{chr(65+i)}. {opt}" for i, opt in enumerate(question_data['options'])])
            is_correct = question_data['student_answer'] == question_data['correct_answer']
            
            prompt = f"""Hãy giải thích ngắn gọn (1-2 câu) bằng tiếng Việt TẠI SAO đáp án đúng là {question_data['correct_answer']}.

Câu hỏi: {question_data['question']}

Các lựa chọn:
{options_text}

QUAN TRỌNG: Đảm bảo giải thích phù hợp với đáp án đúng {question_data['correct_answer']}.

Giải thích:"""

        response = generate_with_retry(prompt)
        if response:
            logger.info("Tạo giải thích thành công")
            return response
        else:
            logger.warning("Model không trả về response, sử dụng fallback")
            return get_fallback_explanation(question_data)

    except Exception as e:
        logger.error(f"Lỗi khi tạo giải thích: {str(e)}", exc_info=True)
        return get_fallback_explanation(question_data)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint kiểm tra trạng thái hoạt động"""
    model_status = "ready" if model is not None and tokenizer is not None else "not_ready"
    return jsonify({
        'status': 'healthy',
        'model_status': model_status,
        'timestamp': datetime.now().isoformat(),
        'service': 'AI Explanation Service (Local Gemma-3-1b-it)',
        'version': '2.0.0',
        'model': 'gemma-3-1b-it (local)',
        'features': [
            'question_explanation', 
            'placement_test_generation', 
            'final_test_generation', 
            'course_recommendation', 
            'learning_path_generation'
        ]
    })

@app.route('/api/explain', methods=['POST'])
def explain():
    """
    API endpoint để nhận yêu cầu giải thích câu trả lời
    
    Request body cần có:
    {
        "question": "Nội dung câu hỏi",
        "options": ["option1", "option2", ...],
        "student_answer": "A",
        "correct_answer": "B",
        "question_type": "multiple-choice" hoặc "true-false"
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu giải thích: {data}")
        
        # Kiểm tra các trường bắt buộc
        required_fields = ['question', 'options', 'student_answer', 'correct_answer', 'question_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        # Kiểm tra loại câu hỏi hợp lệ
        if data['question_type'] not in ['multiple-choice', 'true-false']:
            return jsonify({
                'error': 'Loại câu hỏi không hợp lệ. Phải là "multiple-choice" hoặc "true-false"',
                'status': 400
            }), 400

        # Kiểm tra dữ liệu options cho loại multiple-choice
        if data['question_type'] == 'multiple-choice' and (not isinstance(data['options'], list) or len(data['options']) < 2):
            return jsonify({
                'error': 'Loại câu hỏi multiple-choice yêu cầu ít nhất 2 lựa chọn',
                'status': 400
            }), 400

        # Kiểm tra dữ liệu options cho loại true-false
        if data['question_type'] == 'true-false' and (not isinstance(data['options'], list) or len(data['options']) != 2):
            return jsonify({
                'error': 'Loại câu hỏi true-false yêu cầu chính xác 2 lựa chọn (Đúng/Sai)',
                'status': 400
            }), 400

        # Kiểm tra model đã sẵn sàng chưa
        if model is None or tokenizer is None:
            logger.error("Model chưa được khởi tạo")
            return jsonify({
                'error': 'Model chưa sẵn sàng, vui lòng thử lại sau',
                'status': 503
            }), 503

        # Tạo giải thích
        explanation = generate_explanation(data)
        
        return jsonify({
            'explanation': explanation,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi xử lý yêu cầu: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi xử lý yêu cầu',
            'status': 500
        }), 500

@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    """
    API endpoint để tạo câu hỏi placement test bằng AI
    
    Request body:
    {
        "questionType": "reading|listening|grammar|vocabulary",
        "testType": "IELTS|TOEIC",
        "difficulty": "beginner|intermediate|advanced",
        "count": 5,
        "autoAddToBank": true/false
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu tạo câu hỏi: {data}")
        
        required_fields = ['questionType', 'testType', 'difficulty', 'count']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        # Kiểm tra model đã sẵn sàng chưa
        if model is None or tokenizer is None:
            logger.error("Model chưa được khởi tạo")
            return jsonify({
                'error': 'Model chưa sẵn sàng, vui lòng thử lại sau',
                'status': 503
            }), 503

        questions = generate_placement_questions(data)
        
        # Tự động thêm vào ngân hàng câu hỏi nếu được yêu cầu
        added_questions = []
        if data.get('autoAddToBank', False):
            added_questions = add_questions_to_bank(questions, data)
        
        return jsonify({
            'questions': questions,
            'addedToBank': added_questions,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi tạo câu hỏi: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi tạo câu hỏi',
            'status': 500
        }), 500

@app.route('/api/evaluate-placement', methods=['POST'])
def evaluate_placement():
    """
    API endpoint để đánh giá kết quả placement test bằng AI
    
    Request body:
    {
        "testType": "IELTS|TOEIC",
        "answers": [...],
        "scores": {...},
        "totalScore": {...}
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đánh giá placement test: {data['testType']}")
        
        required_fields = ['testType', 'answers', 'scores', 'totalScore']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        evaluation = evaluate_placement_test(data)
        
        return jsonify(evaluation)

    except Exception as e:
        logger.error(f"Lỗi khi đánh giá placement test: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi đánh giá placement test',
            'status': 500
        }), 500

@app.route('/api/recommend-courses', methods=['POST'])
def recommend_courses():
    """
    API endpoint để đề xuất khóa học dựa trên kết quả placement test
    
    Request body:
    {
        "testType": "IELTS|TOEIC",
        "estimatedLevel": {...},
        "strengths": [...],
        "weaknesses": [...],
        "availableCourses": [...]
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đề xuất khóa học: {data['testType']}")
        
        recommendations = generate_course_recommendations(data)
        
        return jsonify({
            'recommendations': recommendations,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi đề xuất khóa học: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi đề xuất khóa học',
            'status': 500
        }), 500

@app.route('/api/generate-mixed-questions', methods=['POST'])
def generate_mixed_questions():
    """
    API endpoint để tạo câu hỏi placement test hỗn hợp thông minh bằng AI
    
    Request body:
    {
        "testType": "IELTS|TOEIC",
        "difficulty": "beginner|intermediate|advanced",
        "count": 10,
        "topic": "optional topic"
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu tạo câu hỏi hỗn hợp: {data}")
        
        required_fields = ['testType', 'difficulty', 'count']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        questions = generate_mixed_placement_questions(data)
        
        return jsonify({
            'questions': questions,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi tạo câu hỏi hỗn hợp: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi tạo câu hỏi hỗn hợp',
            'status': 500
        }), 500

@app.route('/api/generate-final-test-questions', methods=['POST'])
def generate_final_test_questions():
    """
    API endpoint để tạo câu hỏi Final Test bằng AI
    
    Request body:
    {
        "testType": "IELTS|TOEIC",
        "difficulty": "beginner|intermediate|advanced",
        "count": 5,
        "courseType": "IELTS|TOEIC",
        "targetScoreRange": "6.0-7.0",
        "skills": ["reading", "listening", "grammar", "vocabulary"]
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu tạo câu hỏi Final Test: {data}")
        
        required_fields = ['testType', 'difficulty', 'count']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        questions = generate_final_test_questions_ai(data)
        
        return jsonify({
            'questions': questions,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi tạo câu hỏi Final Test: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi tạo câu hỏi Final Test',
            'status': 500
        }), 500

@app.route('/api/evaluate-final-test', methods=['POST'])
def evaluate_final_test():
    """
    API endpoint để đánh giá kết quả Final Test
    
    Request body:
    {
        "testType": "IELTS|TOEIC",
        "scores": {...},
        "totalScore": {...},
        "answers": [...],
        "targetScoreRange": "6.0-7.0"
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đánh giá Final Test: {data['testType']}")
        
        analysis = evaluate_final_test_ai(data)
        
        return jsonify({
            'analysis': analysis,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi đánh giá Final Test: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi đánh giá Final Test',
            'status': 500
        }), 500

@app.route('/api/recommend-next-courses', methods=['POST'])
def recommend_next_courses():
    """
    API endpoint để đề xuất khóa học tiếp theo sau Final Test
    
    Request body:
    {
        "testType": "IELTS|TOEIC",
        "achievedLevel": {...},
        "currentCourseId": "...",
        "strengths": [...],
        "weaknesses": [...],
        "availableCourses": [...]
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đề xuất khóa học tiếp theo: {data['testType']}")
        
        recommendations = generate_next_course_recommendations(data)
        
        return jsonify({
            'recommendations': recommendations,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi đề xuất khóa học tiếp theo: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi đề xuất khóa học tiếp theo',
            'status': 500
        }), 500

@app.route('/api/generate-learning-path', methods=['POST'])
def generate_learning_path():
    """
    API endpoint để tạo learning path cá nhân hóa
    
    Request body:
    {
        "userId": "user_id",
        "testType": "IELTS|TOEIC", 
        "currentLevel": {...},
        "targetGoal": number,
        "strengths": [...],
        "weaknesses": [...],
        "completedCourses": [...]
    }
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu tạo learning path cho user: {data.get('userId')}")
        
        required_fields = ['testType', 'currentLevel', 'targetGoal']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        learning_path = create_personalized_learning_path(data)
        
        return jsonify({
            'learningPath': learning_path,
            'status': 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi tạo learning path: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Đã xảy ra lỗi khi tạo learning path',
            'status': 500
        }), 500

def add_questions_to_bank(questions, data):
    """Thêm câu hỏi vào ngân hàng câu hỏi thông qua API backend"""
    try:
        import requests
        
        # URL của backend API
        BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:4000')
        
        # Gọi API backend để thêm câu hỏi
        response = requests.post(
            f"{BACKEND_URL}/api/v1/placement-tests/question-bank/ai-add",
            json={"questions": questions},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            added_questions = result.get('data', {}).get('addedQuestions', [])
            logger.info(f"Đã thêm {len(added_questions)} câu hỏi vào ngân hàng")
            return added_questions
        else:
            logger.warning(f"Không thể thêm câu hỏi: {response.text}")
            return []
        
    except Exception as e:
        logger.error(f"Lỗi khi thêm câu hỏi vào ngân hàng: {str(e)}")
        return []

def generate_placement_questions(data):
    """Tạo câu hỏi placement test bằng AI với audio cho listening"""
    question_type = data['questionType']
    test_type = data['testType']
    difficulty = data['difficulty']
    count = min(data['count'], MAX_QUESTIONS_PER_REQUEST)  # Sử dụng config
    
    # Template prompts cải thiện cho model local
    prompts = {
        'reading': f"""Tạo {count} câu hỏi đọc hiểu {test_type} level {difficulty} bằng tiếng Anh.
Mỗi câu hỏi cần có:
- 1 đoạn văn ngắn (100-150 từ)
- 1 câu hỏi về đoạn văn
- 4 lựa chọn A, B, C, D
- Đáp án đúng
- Giải thích ngắn gọn

Format JSON:
{{"questions": [{{"question": "câu hỏi", "passage": "đoạn văn", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "giải thích", "questionType": "reading", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'grammar': f"""Tạo {count} câu hỏi ngữ pháp {test_type} level {difficulty} bằng tiếng Anh.
Mỗi câu hỏi test 1 điểm ngữ pháp cụ thể với 4 lựa chọn.

Format JSON:
{{"questions": [{{"question": "câu hỏi với chỗ trống", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "giải thích ngữ pháp", "questionType": "grammar", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'vocabulary': f"""Tạo {count} câu hỏi từ vựng {test_type} level {difficulty} bằng tiếng Anh.
Mỗi câu hỏi test nghĩa của từ trong ngữ cảnh với 4 lựa chọn.

Format JSON:
{{"questions": [{{"question": "câu hỏi về từ vựng", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "giải thích từ vựng", "questionType": "vocabulary", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'listening': f"""Tạo {count} câu hỏi nghe {test_type} level {difficulty} bằng tiếng Anh.
Mỗi câu hỏi cần có:
- 1 đoạn hội thoại hoặc monologue ngắn (50-80 từ)
- 1 câu hỏi về nội dung
- 4 lựa chọn A, B, C, D
- Đáp án đúng
- Giải thích ngắn gọn

Format JSON:
{{"questions": [{{"question": "câu hỏi", "conversation": "đoạn hội thoại", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "giải thích", "questionType": "listening", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}"""
    }
    
    try:
        prompt = prompts.get(question_type, prompts['grammar'])
        response = generate_with_retry(prompt)
        
        if response:
            # Parse JSON response
            try:
                # Tìm và extract JSON từ response
                start_idx = response.find('{')
                end_idx = response.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response[start_idx:end_idx]
                    result = json.loads(json_str)
                    questions = result.get('questions', [])
                    
                    # Post-process questions
                    for question in questions:
                        # Convert correctAnswer from text to index if needed
                        if 'correctAnswer' in question and 'options' in question:
                            correct_answer = question['correctAnswer']
                            options = question['options']
                            
                            # If correctAnswer is text, convert to index
                            if isinstance(correct_answer, str) and correct_answer not in ['0', '1', '2', '3']:
                                try:
                                    index = options.index(correct_answer)
                                    question['correctAnswer'] = str(index)
                                    logger.info(f"Converted correctAnswer from '{correct_answer}' to index '{index}'")
                                except ValueError:
                                    # If not found, default to first option
                                    question['correctAnswer'] = '0'
                                    logger.warning(f"Could not find '{correct_answer}' in options, defaulting to '0'")
                    
                    # Tạo audio cho listening questions
                    if question_type == 'listening':
                        for i, question in enumerate(questions):
                            if 'conversation' in question:
                                audio_url = create_audio_from_text(
                                    question['conversation'], 
                                    f"listening_{test_type}_{difficulty}_{i}"
                                )
                                question['audioUrl'] = audio_url
                                question['passage'] = question['conversation']  # Đổi tên để phù hợp với schema
                                del question['conversation']
                    
                    return questions if questions else generate_fallback_questions(data)
                else:
                    logger.warning("Không tìm thấy JSON trong response")
                    return generate_fallback_questions(data)
            except json.JSONDecodeError as e:
                logger.error(f"Lỗi parse JSON: {str(e)}")
                return generate_fallback_questions(data)
        else:
            logger.warning("Model không trả về response")
            return generate_fallback_questions(data)
            
    except Exception as e:
        logger.error(f"Lỗi tạo câu hỏi AI: {str(e)}")
        return generate_fallback_questions(data)

def generate_fallback_questions(data):
    """Tạo câu hỏi mẫu khi AI không khả dụng"""
    question_type = data['questionType']
    test_type = data['testType']
    difficulty = data['difficulty']
    count = min(data['count'], 3)
    
    fallback_questions = {
        'grammar': {
            'question': 'Choose the correct form: She _____ to the store yesterday.',
            'options': ['go', 'goes', 'went', 'going'],
            'correctAnswer': '2',  # Index of 'went'
            'explanation': 'Past simple tense for completed action in the past'
        },
        'vocabulary': {
            'question': 'What does "abundant" mean?',
            'options': ['scarce', 'plentiful', 'expensive', 'difficult'],
            'correctAnswer': '1',  # Index of 'plentiful'
            'explanation': 'Abundant means existing in large quantities'
        },
        'reading': {
            'question': 'What is the main idea of the passage?',
            'passage': 'Technology has revolutionized communication. Social media platforms allow instant global connections. However, this brings challenges like privacy concerns and misinformation.',
            'options': ['Technology is bad', 'Communication has changed', 'People are lazy', 'Nothing has changed'],
            'correctAnswer': '1',  # Index of 'Communication has changed'
            'explanation': 'The passage discusses how technology has changed communication'
        },
        'listening': {
            'question': 'What is Sarah planning to study?',
            'conversation': 'A: Hi Sarah, I heard you are planning to study abroad. B: Yes, I am excited! I have been accepted to a university in Canada. A: What will you study? B: International Business.',
            'options': ['Medicine', 'International Business', 'Engineering', 'Arts'],
            'correctAnswer': '1',  # Index of 'International Business'
            'explanation': 'Sarah clearly states she will study International Business'
        }
    }
    
    base_question = fallback_questions.get(question_type, fallback_questions['grammar'])
    
    questions = []
    for i in range(count):
        question = {
            **base_question,
            'questionType': question_type,
            'testType': test_type,
            'difficulty': difficulty
        }
        
        # Tạo audio cho listening questions
        if question_type == 'listening' and 'conversation' in question:
            try:
                audio_url = create_audio_from_text(
                    question['conversation'], 
                    f"fallback_listening_{test_type}_{difficulty}_{i}"
                )
                question['audioUrl'] = audio_url
                question['passage'] = question['conversation']  # Đổi tên để phù hợp với schema
                del question['conversation']
            except Exception as e:
                logger.error(f"Lỗi khi tạo audio cho fallback question: {str(e)}")
                question['audioUrl'] = None
                question['passage'] = question['conversation']
                del question['conversation']
        
        questions.append(question)
    
    return questions

def generate_mixed_placement_questions(data):
    """Tạo câu hỏi placement test hỗn hợp thông minh bằng AI"""
    test_type = data['testType']
    difficulty = data['difficulty']
    count = min(data['count'], 20)  # Giới hạn tối đa 20 câu
    topic = data.get('topic', '')
    
    # AI sẽ chọn tỷ lệ câu hỏi phù hợp cho từng loại
    # Dựa trên best practices của IELTS/TOEIC
    if test_type == 'IELTS':
        # IELTS thường có nhiều reading và listening
        distribution = {
            'reading': 0.35,    # 35%
            'listening': 0.30,  # 30%
            'grammar': 0.20,    # 20%
            'vocabulary': 0.15  # 15%
        }
    else:  # TOEIC
        # TOEIC tập trung vào listening và reading
        distribution = {
            'reading': 0.40,    # 40%
            'listening': 0.35,  # 35%
            'grammar': 0.15,    # 15%
            'vocabulary': 0.10  # 10%
        }
    
    all_questions = []
    
    for question_type, ratio in distribution.items():
        type_count = max(1, int(count * ratio))
        
        # Tạo prompt thông minh cho từng loại
        prompt = f"""Tạo {type_count} câu hỏi {question_type} {test_type} level {difficulty} bằng tiếng Anh.
{f"Chủ đề: {topic}" if topic else ""}

Yêu cầu:
- Câu hỏi phù hợp với format {test_type} chính thức
- Độ khó {difficulty} nhất quán
- Đa dạng về nội dung và kỹ năng test
- Có explanation chi tiết

Format JSON:
{{"questions": [{{"question": "câu hỏi", {"passage": "đoạn văn"," if question_type == 'reading' else ""}{"conversation": "đoạn hội thoại"," if question_type == 'listening' else ""}"options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "giải thích chi tiết", "questionType": "{question_type}", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}"""
        
        try:
            response = generate_with_retry(prompt)
            if response:
                # Tìm và extract JSON từ response
                start_idx = response.find('{')
                end_idx = response.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response[start_idx:end_idx]
                    result = json.loads(json_str)
                    questions = result.get('questions', [])
                    
                    # Tạo audio cho listening questions
                    if question_type == 'listening':
                        for i, question in enumerate(questions):
                            if 'conversation' in question:
                                audio_url = create_audio_from_text(
                                    question['conversation'], 
                                    f"mixed_{test_type}_{difficulty}_{question_type}_{i}"
                                )
                                question['audioUrl'] = audio_url
                                question['passage'] = question['conversation']
                    
                    all_questions.extend(questions)
        except Exception as e:
            logger.error(f"Error generating {question_type} questions: {str(e)}")
            continue
    
    # Shuffle để tạo thứ tự ngẫu nhiên
    import random
    random.shuffle(all_questions)
    
    # Giới hạn số lượng câu hỏi theo yêu cầu
    return all_questions[:count]

def evaluate_placement_test(data):
    """Đánh giá kết quả placement test bằng AI"""
    test_type = data['testType']
    scores = data['scores']
    total_score = data['totalScore']
    answers = data['answers']
    
    # Phân tích writing nếu có
    writing_evaluation = None
    writing_answers = [ans for ans in answers if ans['questionType'] == 'writing']
    
    if writing_answers:
        writing_evaluation = evaluate_writing(writing_answers[0]['userAnswer'], test_type)
    
    # Tạo phân tích tổng thể
    analysis = generate_overall_analysis(data)
    
    # Ước tính level chính xác hơn
    estimated_level = refine_level_estimation(data)
    
    # Tạo skill analysis chi tiết
    skill_analysis = generate_skill_analysis(data)
    
    return {
        'writingEvaluation': writing_evaluation,
        'analysis': analysis,
        'estimatedLevel': estimated_level,
        'skillAnalysis': skill_analysis,
        'status': 200
    }

def generate_skill_analysis(data):
    """Tạo phân tích chi tiết cho từng kỹ năng"""
    scores = data['scores']
    answers = data['answers']
    test_type = data['testType']
    
    skill_analysis = {}
    
    # Phân tích Reading
    if 'reading' in scores:
        reading_score_data = scores['reading']
        if isinstance(reading_score_data, dict):
            if 'percentage' in reading_score_data:
                if isinstance(reading_score_data['percentage'], dict) and '$numberInt' in reading_score_data['percentage']:
                    reading_score = int(reading_score_data['percentage']['$numberInt'])
                else:
                    reading_score = reading_score_data['percentage']
            else:
                reading_score = 0
        else:
            reading_score = reading_score_data
            
        reading_analysis = {
            'score': reading_score,
            'strengths': [],
            'weaknesses': [],
            'recommendations': []
        }
        
        if reading_score >= 80:
            reading_analysis['strengths'].append('Đọc hiểu nhanh và chính xác')
            reading_analysis['strengths'].append('Nắm ý chính tốt')
        elif reading_score >= 60:
            reading_analysis['strengths'].append('Có khả năng đọc hiểu cơ bản')
        else:
            reading_analysis['weaknesses'].append('Cần cải thiện tốc độ đọc')
            reading_analysis['weaknesses'].append('Chưa nắm được ý chính')
        
        if reading_score < 70:
            reading_analysis['recommendations'].append('Luyện đọc báo tiếng Anh hàng ngày')
            reading_analysis['recommendations'].append('Học thêm từ vựng học thuật')
        
        skill_analysis['reading'] = reading_analysis
    
    # Phân tích Listening
    if 'listening' in scores:
        listening_score_data = scores['listening']
        if isinstance(listening_score_data, dict):
            if 'percentage' in listening_score_data:
                if isinstance(listening_score_data['percentage'], dict) and '$numberInt' in listening_score_data['percentage']:
                    listening_score = int(listening_score_data['percentage']['$numberInt'])
                else:
                    listening_score = listening_score_data['percentage']
            else:
                listening_score = 0
        else:
            listening_score = listening_score_data
            
        listening_analysis = {
            'score': listening_score,
            'strengths': [],
            'weaknesses': [],
            'recommendations': []
        }
        
        if listening_score >= 80:
            listening_analysis['strengths'].append('Nghe hiểu hội thoại tốt')
            listening_analysis['strengths'].append('Phân biệt được các accent khác nhau')
        elif listening_score >= 60:
            listening_analysis['strengths'].append('Có khả năng nghe hiểu cơ bản')
        else:
            listening_analysis['weaknesses'].append('Khó nghe accent Anh-Anh')
            listening_analysis['weaknesses'].append('Cần cải thiện khả năng nghe chi tiết')
        
        if listening_score < 70:
            listening_analysis['recommendations'].append('Nghe podcast tiếng Anh hàng ngày')
            listening_analysis['recommendations'].append('Luyện nghe accent đa dạng')
        
        skill_analysis['listening'] = listening_analysis
    
    # Phân tích Writing
    if 'writing' in scores:
        writing_score_data = scores['writing']
        if isinstance(writing_score_data, dict):
            if 'percentage' in writing_score_data:
                if isinstance(writing_score_data['percentage'], dict) and '$numberInt' in writing_score_data['percentage']:
                    writing_score = int(writing_score_data['percentage']['$numberInt'])
                else:
                    writing_score = writing_score_data['percentage']
            else:
                writing_score = 0
        else:
            writing_score = writing_score_data
            
        writing_analysis = {
            'score': writing_score,
            'strengths': [],
            'weaknesses': [],
            'recommendations': []
        }
        
        if writing_score >= 80:
            writing_analysis['strengths'].append('Viết mạch lạc và logic')
            writing_analysis['strengths'].append('Sử dụng từ vựng đa dạng')
        elif writing_score >= 60:
            writing_analysis['strengths'].append('Có khả năng viết cơ bản')
        else:
            writing_analysis['weaknesses'].append('Cần cải thiện ngữ pháp')
            writing_analysis['weaknesses'].append('Từ vựng còn hạn chế')
        
        if writing_score < 70:
            writing_analysis['recommendations'].append('Luyện viết theo chủ đề hàng ngày')
            writing_analysis['recommendations'].append('Học thêm cấu trúc câu phức tạp')
        
        skill_analysis['writing'] = writing_analysis
    
    # Phân tích Speaking (nếu có)
    if 'speaking' in scores:
        speaking_score = scores['speaking'].get('percentage', 0)
        speaking_analysis = {
            'score': speaking_score,
            'strengths': [],
            'weaknesses': [],
            'recommendations': []
        }
        
        if speaking_score >= 80:
            speaking_analysis['strengths'].append('Phát âm rõ ràng và chính xác')
            speaking_analysis['strengths'].append('Giao tiếp tự tin')
        elif speaking_score >= 60:
            speaking_analysis['strengths'].append('Có khả năng giao tiếp cơ bản')
        else:
            speaking_analysis['weaknesses'].append('Cần cải thiện phát âm')
            speaking_analysis['weaknesses'].append('Thiếu tự tin khi nói')
        
        if speaking_score < 70:
            speaking_analysis['recommendations'].append('Luyện phát âm với audio')
            speaking_analysis['recommendations'].append('Thực hành nói với người bản xứ')
        
        skill_analysis['speaking'] = speaking_analysis
    
    return skill_analysis

def evaluate_writing(writing_text, test_type):
    """Đánh giá bài viết bằng AI"""
    prompt = f"""Đánh giá bài viết {test_type} sau đây theo 4 tiêu chí (thang điểm 0-10):
1. Grammar (Ngữ pháp)
2. Vocabulary (Từ vựng) 
3. Coherence (Mạch lạc)
4. Task Achievement (Hoàn thành nhiệm vụ)

Bài viết: "{writing_text}"

Trả về JSON:
{{"grammar": 7, "vocabulary": 6, "coherence": 8, "taskAchievement": 7, "feedback": "Nhận xét chi tiết bằng tiếng Việt"}}"""
    
    try:
        response = generate_with_retry(prompt)
        if response:
            # Tìm và extract JSON từ response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
    except:
        pass
    
    # Fallback evaluation
    return {
        'grammar': 6,
        'vocabulary': 6,
        'coherence': 6,
        'taskAchievement': 6,
        'feedback': 'Bài viết cần cải thiện về ngữ pháp và từ vựng.'
    }

def generate_overall_analysis(data):
    """Tạo phân tích tổng thể"""
    scores = data['scores']
    test_type = data['testType']
    total_score = data['totalScore']

    # Đảm bảo total_score là number
    if isinstance(total_score, dict):
        # Xử lý MongoDB format với $numberInt
        if 'percentage' in total_score:
            if isinstance(total_score['percentage'], dict) and '$numberInt' in total_score['percentage']:
                total_score = int(total_score['percentage']['$numberInt'])
            else:
                total_score = total_score['percentage']
        elif 'raw' in total_score:
            if isinstance(total_score['raw'], dict) and '$numberInt' in total_score['raw']:
                total_score = int(total_score['raw']['$numberInt'])
            else:
                total_score = total_score['raw']
        else:
            total_score = 0
    elif not isinstance(total_score, (int, float)):
        total_score = 0

    # Xác định điểm mạnh và yếu
    skill_scores = {}
    for skill, score_data in scores.items():
        if isinstance(score_data, dict):
            # Xử lý MongoDB format với $numberInt
            if 'percentage' in score_data:
                if isinstance(score_data['percentage'], dict) and '$numberInt' in score_data['percentage']:
                    skill_scores[skill] = int(score_data['percentage']['$numberInt'])
                else:
                    skill_scores[skill] = score_data['percentage']
            else:
                skill_scores[skill] = 0
        else:
            skill_scores[skill] = score_data
    
    sorted_skills = sorted(skill_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Cải thiện logic để luôn có analysis hữu ích
    strengths = []
    weaknesses = []
    
    # Lấy điểm mạnh: skill >= 70% hoặc 2 skill cao nhất nếu không có skill nào >= 70%
    high_score_skills = [skill for skill, score in sorted_skills if score >= 70]
    if high_score_skills:
        strengths = high_score_skills[:2]  # Lấy tối đa 2 skill mạnh nhất
    else:
        # Nếu không có skill nào >= 70%, lấy 1-2 skill cao nhất (nếu > 0)
        strengths = [skill for skill, score in sorted_skills[:2] if score > 0]
    
    # Lấy điểm yếu: skill < 60% hoặc 2 skill thấp nhất
    low_score_skills = [skill for skill, score in sorted_skills if score < 60 and score >= 0]
    if low_score_skills:
        weaknesses = low_score_skills[-2:]  # Lấy 2 skill yếu nhất
    else:
        # Nếu tất cả skill đều >= 60%, lấy 2 skill thấp nhất
        weaknesses = [skill for skill, score in sorted_skills[-2:]]
    
    # Tạo recommendations dựa trên weaknesses
    recommendations = []
    if 'grammar' in [w.lower() for w in weaknesses]:
        recommendations.append('Tập trung luyện ngữ pháp cơ bản')
    if 'vocabulary' in [w.lower() for w in weaknesses]:
        recommendations.append('Mở rộng vốn từ vựng hàng ngày')
    if 'reading' in [w.lower() for w in weaknesses]:
        recommendations.append('Luyện đọc hiểu với các chủ đề đa dạng')
    if 'listening' in [w.lower() for w in weaknesses]:
        recommendations.append('Nghe các tài liệu audio phù hợp với trình độ')
    if 'writing' in [w.lower() for w in weaknesses]:
        recommendations.append('Luyện viết theo chủ đề thường gặp')
    if 'speaking' in [w.lower() for w in weaknesses]:
        recommendations.append('Thực hành nói với người bản xứ')
    
    # Đảm bảo luôn có ít nhất 2-3 recommendations
    if len(recommendations) < 2:
        base_recommendations = [
            'Luyện tập thường xuyên để cải thiện kỹ năng',
            'Tham gia các khóa học phù hợp với trình độ',
            'Thực hành với các tài liệu authentic'
        ]
        for rec in base_recommendations:
            if rec not in recommendations:
                recommendations.append(rec)
                if len(recommendations) >= 3:
                    break
    
    # Xác định learning style dựa trên performance
    learning_style = 'visual'  # default
    if total_score >= 80:
        learning_style = 'mixed'
    elif total_score >= 60:
        learning_style = 'visual'
    else:
        learning_style = 'kinesthetic'
    
    # Xác định optimal pace
    if total_score >= 80:
        optimal_pace = 'fast'
    elif total_score >= 60:
        optimal_pace = 'moderate'
    else:
        optimal_pace = 'slow'
    
    return {
        'strengths': strengths,
        'weaknesses': weaknesses,
        'recommendations': recommendations,
        'learningStyle': learning_style,
        'optimalPace': optimal_pace,
        'preferredContentType': 'video',
        'preferredDifficulty': 'moderate',
        'studyPlan': {
            'duration': 12,  # 12 tuần
            'hoursPerWeek': 10,
            'focusAreas': weaknesses[:2] if weaknesses else ['General English']
        }
    }

def refine_level_estimation(data):
    """Tinh chỉnh ước tính level dựa trên phân tích chi tiết"""
    # Sử dụng logic hiện tại, có thể cải thiện sau
    return None  # Để backend tự tính

def generate_final_test_questions_ai(data):
    """Tạo câu hỏi Final Test bằng AI với độ khó cao hơn placement test"""
    test_type = data['testType']
    difficulty = data['difficulty']
    original_count = data['count']
    # Giới hạn số lượng cho model local
    count = min(original_count, 20)  # Tăng từ 10 lên 20 nhưng vẫn giới hạn
    course_type = data.get('courseType', test_type)
    target_score_range = data.get('targetScoreRange', '')
    skills = data.get('skills', ['reading', 'listening', 'grammar', 'vocabulary'])
    
    logger.info(f"Tạo Final Test: {original_count} câu được yêu cầu, giới hạn xuống {count} câu cho model local")
    
    # Nếu có skills array, tạo câu hỏi cho từng skill
    if skills and isinstance(skills, list):
        all_questions = []
        questions_per_skill = max(1, min(3, count // len(skills)))  # Tối đa 3 câu mỗi skill
        
        for skill in skills:
            logger.info(f"Tạo {questions_per_skill} câu hỏi cho skill: {skill}")
            skill_questions = generate_questions_for_skill(skill, test_type, difficulty, questions_per_skill, course_type, target_score_range)
            if skill_questions:  # Kiểm tra None
                all_questions.extend(skill_questions)
                logger.info(f"Đã tạo {len(skill_questions)} câu hỏi cho {skill}")
            else:
                logger.warning(f"Không thể tạo câu hỏi cho skill: {skill}, sử dụng fallback")
                # Tạo fallback questions cho skill này
                fallback_questions = generate_fallback_final_test_questions({
                    'testType': test_type,
                    'difficulty': difficulty,
                    'count': questions_per_skill,
                    'skills': [skill]
                })
                if fallback_questions:
                    all_questions.extend(fallback_questions)
                    logger.info(f"Đã tạo {len(fallback_questions)} fallback câu hỏi cho {skill}")
        
        # Nếu không có câu hỏi nào được tạo, trả về fallback
        if not all_questions:
            return generate_fallback_final_test_questions({
                'testType': test_type,
                'difficulty': difficulty,
                'count': count,
                'skills': skills
            })
        
        return all_questions
    else:
        # Fallback: tạo câu hỏi cho tất cả skills
        result = generate_questions_for_skill('reading', test_type, difficulty, count, course_type, target_score_range)
        if result:
            return result
        else:
            return generate_fallback_final_test_questions({
                'testType': test_type,
                'difficulty': difficulty,
                'count': count,
                'skills': ['reading']
            })

def get_difficulty_description(test_type, difficulty):
    """Lấy mô tả difficulty level"""
    difficulty_map = {
        'IELTS': {
            4.0: 'Limited User', 4.5: 'Limited User+', 5.0: 'Modest User', 5.5: 'Modest User+',
            6.0: 'Competent User', 6.5: 'Competent User+', 7.0: 'Good User', 7.5: 'Good User+',
            8.0: 'Very Good User', 8.5: 'Very Good User+', 9.0: 'Expert User'
        },
        'TOEIC': {
            250: 'Elementary', 300: 'Elementary+', 350: 'Pre-Intermediate', 400: 'Pre-Intermediate+',
            450: 'Intermediate', 500: 'Intermediate+', 550: 'Upper-Intermediate', 600: 'Upper-Intermediate+',
            650: 'Pre-Advanced', 700: 'Advanced', 750: 'Advanced+', 800: 'Proficient',
            850: 'Proficient+', 900: 'Expert', 950: 'Expert+', 990: 'Native-like'
        }
    }
    
    # Convert difficulty to number if it's string
    try:
        difficulty_num = float(difficulty)
    except (ValueError, TypeError):
        return f"{test_type} {difficulty}"
    
    return difficulty_map.get(test_type, {}).get(difficulty_num, f"{test_type} {difficulty}")

def get_difficulty_context(test_type, difficulty):
    """Lấy context cho difficulty level để AI hiểu rõ hơn"""
    try:
        difficulty_num = float(difficulty)
    except (ValueError, TypeError):
        return "intermediate level"
    
    if test_type == 'IELTS':
        if difficulty_num <= 4.5:
            return "basic vocabulary, simple grammar, short passages, clear main ideas"
        elif difficulty_num <= 5.5:
            return "common vocabulary, basic to intermediate grammar, moderate passages, explicit information"
        elif difficulty_num <= 6.5:
            return "academic vocabulary, complex grammar, longer passages, implicit meanings"
        elif difficulty_num <= 7.5:
            return "advanced vocabulary, sophisticated grammar, complex texts, nuanced understanding"
        else:
            return "expert-level vocabulary, complex structures, academic texts, subtle implications"
    else:  # TOEIC
        if difficulty_num <= 400:
            return "basic business vocabulary, simple grammar, short conversations, direct information"
        elif difficulty_num <= 600:
            return "common business terms, intermediate grammar, workplace scenarios, clear contexts"
        elif difficulty_num <= 750:
            return "professional vocabulary, complex grammar, business situations, implied meanings"
        elif difficulty_num <= 900:
            return "advanced business language, sophisticated structures, complex scenarios, nuanced communication"
        else:
            return "expert business vocabulary, native-like structures, complex business contexts, subtle implications"

def generate_questions_for_skill(question_type, test_type, difficulty, count, course_type, target_score_range):
    """Tạo câu hỏi cho một skill cụ thể với difficulty theo thang điểm"""
    
    # Xác định difficulty level description
    difficulty_desc = get_difficulty_description(test_type, difficulty)
    difficulty_context = get_difficulty_context(test_type, difficulty)
    
    # Improved prompts cho Final Test với chất lượng cao hơn
    if test_type == 'IELTS':
        topic_focus = "academic topics: environment, technology, education, health, society"
    else:  # TOEIC
        topic_focus = "business topics: workplace, meetings, emails, reports, finance"
        
    prompts = {
        'reading': f"""Create {count} unique {test_type} reading questions for {difficulty_desc} level.

Write ORIGINAL passages about {topic_focus}. DO NOT use generic passages about "technology revolutionizing communication".

Requirements:
- Passage: 80-120 words, {difficulty_desc} level vocabulary
- Question: Main idea, detail, or inference
- Options: 4 realistic choices
- Answer: Use index "0", "1", "2", or "3"

Example topics: renewable energy, workplace productivity, urban planning, digital privacy, sustainable agriculture

JSON format:
{{"questions": [{{"question": "What does the author suggest about renewable energy?", "passage": "Solar panels have become increasingly affordable for homeowners. Recent technological advances have improved their efficiency by 40% while reducing costs. Many governments now offer tax incentives for solar installations. However, energy storage remains a challenge for widespread adoption.", "options": ["Solar panels are too expensive", "Technology has improved solar efficiency", "Governments oppose solar energy", "Storage is not important"], "correctAnswer": "1", "explanation": "The passage states that technological advances improved efficiency by 40%", "questionType": "reading", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'listening': f"""Create {count} {test_type} listening questions for {difficulty_desc} level.

Create a realistic conversation about {topic_focus} and a comprehension question.

IMPORTANT: 
- Use index numbers (0,1,2,3) for correctAnswer, NOT the full text
- Make the conversation natural and appropriate for {difficulty_desc} level
- Create 4 distinct, plausible options

JSON format:
{{"questions": [{{"question": "What is the speaker's concern?", "conversation": "A: I'm worried about tomorrow's presentation. B: You've prepared well. A: But what if I forget the key points? B: Just focus on the main message.", "options": ["He's excited about presenting", "He's nervous about forgetting", "He's angry with his colleague", "He's confident about success"], "correctAnswer": "1", "explanation": "The speaker explicitly states his worry about forgetting key points", "questionType": "listening", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'grammar': f"""Create {count} grammar questions for {test_type} level {difficulty}.

IMPORTANT: Use index numbers (0,1,2,3) for correctAnswer, NOT the full text.

JSON format:
{{"questions": [{{"question": "She _____ to work every day.", "options": ["go", "goes", "going", "went"], "correctAnswer": "1", "explanation": "Present simple third person singular requires 'goes'", "questionType": "grammar", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'vocabulary': f"""Create {count} {test_type} vocabulary questions for {difficulty_desc} level.

Create vocabulary questions with words appropriate for {difficulty_desc} level about {topic_focus}.

IMPORTANT: Use index numbers (0,1,2,3) for correctAnswer, NOT the full text.

JSON format:
{{"questions": [{{"question": "The company's innovative approach has led to remarkable growth.", "options": ["traditional", "creative", "expensive", "difficult"], "correctAnswer": "1", "explanation": "Innovative means introducing new ideas or creative methods", "questionType": "vocabulary", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'writing': f"""Create {count} {test_type} {difficulty} writing tasks.

JSON format:
{{"questions": [{{"question": "Write about the advantages and disadvantages of remote work", "taskDescription": "Discuss both positive and negative aspects of working from home", "wordLimit": "200-250 words", "questionType": "writing", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}""",
        
        'speaking': f"""Create {count} {test_type} {difficulty} speaking tasks.

JSON format:
{{"questions": [{{"question": "Describe a challenging situation at work", "speakingPrompt": "Talk about a difficult problem you solved at work and how you handled it", "expectedResponse": "Personal experience with problem-solving", "timeLimit": "2-3 minutes", "questionType": "speaking", "testType": "{test_type}", "difficulty": "{difficulty}"}}]}}"""
    }
    
    try:
        prompt = prompts.get(question_type, prompts['grammar'])
        response = generate_with_retry(prompt)
        
        if response:
            # Parse JSON response
            try:
                # Tìm và extract JSON từ response
                start_idx = response.find('{')
                end_idx = response.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response[start_idx:end_idx]
                    result = json.loads(json_str)
                    questions = result.get('questions', [])
                    
                    # Post-process questions
                    for question in questions:
                        # Convert correctAnswer from text to index if needed
                        if 'correctAnswer' in question and 'options' in question:
                            correct_answer = question['correctAnswer']
                            options = question['options']
                            
                            # If correctAnswer is text, convert to index
                            if isinstance(correct_answer, str) and correct_answer not in ['0', '1', '2', '3']:
                                try:
                                    index = options.index(correct_answer)
                                    question['correctAnswer'] = str(index)
                                    logger.info(f"Converted correctAnswer from '{correct_answer}' to index '{index}'")
                                except ValueError:
                                    # If not found, default to first option
                                    question['correctAnswer'] = '0'
                                    logger.warning(f"Could not find '{correct_answer}' in options, defaulting to '0'")
                    
                    # Tạo audio cho listening questions
                    if question_type == 'listening':
                        for i, question in enumerate(questions):
                            if 'conversation' in question:
                                audio_url = create_audio_from_text(
                                    question['conversation'], 
                                    f"final_listening_{test_type}_{difficulty}_{i}"
                                )
                                question['audioUrl'] = audio_url
                                question['passage'] = question['conversation']  # Đổi tên để phù hợp với schema
                                del question['conversation']
                    
                    return questions if questions else []
            except json.JSONDecodeError as e:
                logger.error(f"Lỗi parse JSON: {str(e)}")
                return []
        else:
            logger.warning("Model không trả về response cho Final Test")
            return []
            
    except Exception as e:
        logger.error(f"Lỗi tạo câu hỏi Final Test AI: {str(e)}")
        return []

def generate_fallback_final_test_questions(data):
    """Tạo câu hỏi fallback chất lượng cao cho Final Test"""
    test_type = data['testType']
    difficulty = data['difficulty']
    count = data['count']
    skills = data.get('skills', ['reading', 'listening', 'grammar', 'vocabulary'])
    
    # Templates chất lượng cao cho từng skill
    templates = {
        'reading': [
            {
                'question': 'What is the main idea of the passage?',
                'passage': 'Climate change is one of the most pressing issues of our time. Rising global temperatures have led to melting ice caps, rising sea levels, and extreme weather patterns. Scientists worldwide are working together to find solutions to reduce greenhouse gas emissions and develop sustainable energy sources. Individual actions, such as reducing energy consumption and supporting renewable energy, can also make a significant difference.',
                'options': ['Climate change causes and effects', 'Scientists working on solutions', 'Individual environmental actions', 'Global temperature changes'],
                'correctAnswer': '0',  # Index of first option
                'explanation': 'The passage discusses both the causes and effects of climate change, making this the main idea.'
            },
            {
                'question': 'According to the passage, what can individuals do to help?',
                'passage': 'Sustainable living has become increasingly important in modern society. People are adopting eco-friendly practices such as recycling, using public transportation, and choosing organic products. These small changes in daily habits can collectively have a significant positive impact on the environment.',
                'options': ['Use public transport only', 'Recycle and choose organic products', 'Buy more eco-friendly items', 'Change all daily habits'],
                'correctAnswer': '1',  # Index of second option
                'explanation': 'The passage mentions recycling and choosing organic products as examples of eco-friendly practices.'
            }
        ],
        'listening': [
            {
                'question': 'What time does the library close today?',
                'conversation': 'A: Excuse me, what time does the library close today? B: We close at 8 PM on weekdays, but today is Friday so we close at 6 PM. A: Thank you, I need to return these books before then.',
                'options': ['6 PM', '8 PM', '9 PM', '5 PM'],
                'correctAnswer': '0',  # Index of '6 PM'
                'explanation': 'The librarian says they close at 6 PM on Friday.'
            },
            {
                'question': 'What does the woman want to do?',
                'conversation': 'A: I would like to book a table for two at 7:30 PM tonight. B: I am sorry, but we are fully booked at that time. Would 8:00 PM work for you? A: Yes, that would be perfect.',
                'options': ['Book a table for tonight', 'Cancel a reservation', 'Change the time to 8 PM', 'Ask about the menu'],
                'correctAnswer': '0',  # Index of 'Book a table for tonight'
                'explanation': 'The woman initially wants to book a table for 7:30 PM tonight.'
            }
        ],
        'grammar': [
            {
                'question': 'She _____ to the store when it started raining.',
                'options': ['was walking', 'walked', 'walks', 'had walked'],
                'correctAnswer': '0',  # Index of 'was walking'
                'explanation': 'Past continuous tense is used to describe an action in progress when another action occurred.'
            },
            {
                'question': 'If I _____ more time, I would travel around the world.',
                'options': ['have', 'had', 'will have', 'would have'],
                'correctAnswer': '1',  # Index of 'had'
                'explanation': 'Second conditional uses "if + past simple" for hypothetical situations.'
            }
        ],
        'vocabulary': [
            {
                'question': 'The word "abundant" is closest in meaning to:',
                'options': ['scarce', 'plentiful', 'expensive', 'rare'],
                'correctAnswer': '1',  # Index of 'plentiful'
                'explanation': 'Abundant means existing in large quantities, which is synonymous with plentiful.'
            },
            {
                'question': 'What does "deteriorate" mean?',
                'options': ['improve gradually', 'become worse', 'stay the same', 'change completely'],
                'correctAnswer': '1',  # Index of 'become worse'
                'explanation': 'Deteriorate means to become progressively worse or to decline in quality.'
            }
        ]
    }
    
    questions = []
    questions_per_skill = max(1, count // len(skills))
    
    for skill in skills:
        skill_templates = templates.get(skill, templates['grammar'])
        for i in range(questions_per_skill):
            template_index = i % len(skill_templates)
            template = skill_templates[template_index]
            
            question = {
                'questionType': skill,
                'testType': test_type,
                'difficulty': difficulty,
                **template
            }
            
            # Thêm passage cho reading nếu có
            if skill == 'reading' and 'passage' not in question:
                question['passage'] = ''
                
            # Thêm conversation cho listening và tạo audio URL
            if skill == 'listening' and 'conversation' in template:
                question['passage'] = template['conversation']
                # Tạo audio URL (placeholder)
                question['audioUrl'] = create_audio_from_text(template['conversation'], f"fallback_{skill}_{i}")
                
            questions.append(question)
    
    return questions

def evaluate_final_test_ai(data):
    """Đánh giá kết quả Final Test bằng AI"""
    test_type = data['testType']
    scores = data['scores']
    total_score = data['totalScore']
    target_score_range = data.get('targetScoreRange', '')
    
    # Phân tích writing/speaking nếu có
    writing_evaluation = None
    speaking_evaluation = None
    
    writing_answers = [ans for ans in data.get('answers', []) if ans['questionType'] == 'writing']
    speaking_answers = [ans for ans in data.get('answers', []) if ans['questionType'] == 'speaking']
    
    if writing_answers:
        writing_evaluation = evaluate_writing(writing_answers[0]['userAnswer'], test_type)
    
    if speaking_answers:
        speaking_evaluation = evaluate_speaking(speaking_answers[0]['userAnswer'], test_type)
    
    # Tạo phân tích tổng thể cho Final Test
    analysis = generate_final_test_analysis(data)
    
    # Kiểm tra target achievement
    target_achieved = check_target_achievement(data)
    
    return {
        'strengths': analysis.get('strengths', []),
        'weaknesses': analysis.get('weaknesses', []),
        'recommendations': analysis.get('recommendations', []),
        'improvementAreas': analysis.get('improvementAreas', []),
        'confidenceLevel': analysis.get('confidenceLevel', 'medium'),
        'targetAchieved': target_achieved,
        'writingEvaluation': writing_evaluation,
        'speakingEvaluation': speaking_evaluation
    }

def evaluate_speaking(text, test_type):
    """Đánh giá speaking (placeholder - có thể mở rộng sau)"""
    return {
        'pronunciation': 7,
        'fluency': 6,
        'vocabulary': 7,
        'grammar': 6,
        'feedback': 'Cần cải thiện fluency và grammar trong speaking.'
    }

def generate_final_test_analysis(data):
    """Tạo phân tích chi tiết cho Final Test"""
    scores = data['scores']
    total_score = data['totalScore']
    target_score_range = data.get('targetScoreRange', '')
    
    # Xử lý total_score
    if isinstance(total_score, dict):
        if 'percentage' in total_score:
            if isinstance(total_score['percentage'], dict) and '$numberInt' in total_score['percentage']:
                total_score = int(total_score['percentage']['$numberInt'])
            else:
                total_score = total_score['percentage']
        else:
            total_score = 0
    elif not isinstance(total_score, (int, float)):
        total_score = 0
    
    # Phân tích chi tiết hơn cho Final Test
    skill_scores = {}
    for skill, score_data in scores.items():
        if isinstance(score_data, dict):
            if 'percentage' in score_data:
                if isinstance(score_data['percentage'], dict) and '$numberInt' in score_data['percentage']:
                    skill_scores[skill] = int(score_data['percentage']['$numberInt'])
                else:
                    skill_scores[skill] = score_data['percentage']
            else:
                skill_scores[skill] = 0
        else:
            skill_scores[skill] = score_data
    
    sorted_skills = sorted(skill_scores.items(), key=lambda x: x[1], reverse=True)
    
    strengths = []
    weaknesses = []
    improvement_areas = []
    
    # Phân tích strengths và weaknesses cho Final Test
    for skill, score in sorted_skills:
        if score >= 75:
            strengths.append(skill)
        elif score < 65:
            weaknesses.append(skill)
            improvement_areas.append(f"Cải thiện {skill} từ {score}% lên ít nhất 70%")
    
    # Tạo recommendations cụ thể cho Final Test
    recommendations = []
    if 'grammar' in weaknesses:
        recommendations.append('Tập trung luyện ngữ pháp nâng cao')
    if 'vocabulary' in weaknesses:
        recommendations.append('Mở rộng vốn từ vựng học thuật')
    if 'reading' in weaknesses:
        recommendations.append('Luyện đọc hiểu văn bản phức tạp')
    if 'listening' in weaknesses:
        recommendations.append('Nghe các tài liệu học thuật')
    if 'writing' in weaknesses:
        recommendations.append('Luyện viết essay học thuật')
    if 'speaking' in weaknesses:
        recommendations.append('Thực hành speaking với chủ đề phức tạp')
    
    # Xác định confidence level
    if total_score >= 80:
        confidence_level = 'high'
    elif total_score >= 70:
        confidence_level = 'medium'
    else:
        confidence_level = 'low'
    
    return {
        'strengths': strengths,
        'weaknesses': weaknesses,
        'recommendations': recommendations,
        'improvementAreas': improvement_areas,
        'confidenceLevel': confidence_level
    }

def check_target_achievement(data):
    """Kiểm tra xem có đạt được target score không"""
    total_score = data['totalScore']
    target_score_range = data.get('targetScoreRange', '')
    
    if not target_score_range:
        return False
    
    # Xử lý total_score
    if isinstance(total_score, dict):
        if 'percentage' in total_score:
            if isinstance(total_score['percentage'], dict) and '$numberInt' in total_score['percentage']:
                total_score = int(total_score['percentage']['$numberInt'])
            else:
                total_score = total_score['percentage']
        else:
            total_score = 0
    elif not isinstance(total_score, (int, float)):
        total_score = 0
    
    # Parse target range (e.g., "6.0-7.0" or "550-650")
    try:
        min_target, max_target = target_score_range.split('-')
        min_target = float(min_target)
        max_target = float(max_target) if max_target != '+' else float('inf')
        
        return total_score >= min_target
    except:
        return False

def generate_next_course_recommendations(data):
    """Đề xuất khóa học tiếp theo sau Final Test"""
    test_type = data['testType']
    achieved_level = data['achievedLevel']
    current_course_id = data.get('currentCourseId', '')
    weaknesses = data.get('weaknesses', [])
    available_courses = data.get('availableCourses', [])
    
    recommendations = []
    
    for course in available_courses:
        # Tránh đề xuất khóa học hiện tại
        if course['_id'] == current_course_id:
            continue
            
        # Logic đề xuất khóa học tiếp theo
        priority = 3  # mặc định
        reason = f"Khóa học tiếp theo phù hợp với trình độ {test_type} đã đạt được"
        
        # Tăng priority nếu course focus vào weakness
        course_skills = course.get('skills', [])
        if any(weakness.lower() in [skill.lower() for skill in course_skills] for weakness in weaknesses):
            priority = 5
            reason = f"Tập trung cải thiện {', '.join(weaknesses)}"
        
        # Tăng priority nếu course có level cao hơn
        course_target = course.get('targetScoreRange', '')
        if course_target and achieved_level:
            # Logic so sánh level (có thể cải thiện)
            priority += 1
            reason += " - Nâng cao trình độ"
        
        recommendations.append({
            'courseId': course['_id'],
            'title': course['title'],
            'reason': reason,
            'priority': priority,
            'matchScore': priority * 20
        })
    
    # Sắp xếp theo priority
    recommendations.sort(key=lambda x: x['priority'], reverse=True)
    
    return recommendations[:5]  # Trả về top 5

def generate_course_recommendations(data):
    """Đề xuất khóa học dựa trên kết quả placement test"""
    test_type = data['testType']
    estimated_level = data['estimatedLevel']
    weaknesses = data.get('weaknesses', [])
    available_courses = data.get('availableCourses', [])
    
    recommendations = []
    
    for course in available_courses:
        # Logic đơn giản để match course với level và weaknesses
        priority = 3  # mặc định
        reason = f"Phù hợp với trình độ {test_type} hiện tại"
        
        # Tăng priority nếu course focus vào weakness
        course_skills = course.get('skills', [])
        if any(weakness.lower() in [skill.lower() for skill in course_skills] for weakness in weaknesses):
            priority = 5
            reason = f"Tập trung cải thiện {', '.join(weaknesses)}"
        
        recommendations.append({
            'courseId': course['_id'],
            'title': course['title'],
            'reason': reason,
            'priority': priority,
            'matchScore': priority * 20
        })
    
    # Sắp xếp theo priority
    recommendations.sort(key=lambda x: x['priority'], reverse=True)
    
    return recommendations[:5]  # Trả về top 5

def create_personalized_learning_path(data):
    """Tạo learning path cá nhân hóa dựa trên dữ liệu user"""
    test_type = data['testType']
    current_level = data['currentLevel']
    target_goal = data['targetGoal']
    strengths = data.get('strengths', [])
    weaknesses = data.get('weaknesses', [])
    completed_courses = data.get('completedCourses', [])
    
    # Xác định current score
    if test_type == 'IELTS':
        current_score = current_level.get('ielts', {}).get('overall', 4.0)
        max_score = 9.0
    else:
        current_score = current_level.get('toeic', {}).get('overall', 250)
        max_score = 990
    
    # Tính gap và ước tính thời gian cần thiết
    score_gap = target_goal - current_score
    estimated_weeks = estimate_study_duration(test_type, score_gap, weaknesses)
    
    # Tạo learning path
    learning_path = {
        'overview': {
            'currentScore': current_score,
            'targetScore': target_goal,
            'scoreGap': score_gap,
            'estimatedDuration': estimated_weeks,
            'difficulty': classify_difficulty(score_gap, test_type)
        },
        'phases': create_learning_phases(test_type, current_score, target_goal, weaknesses),
        'focusAreas': prioritize_focus_areas(weaknesses, strengths),
        'studyPlan': {
            'hoursPerWeek': calculate_recommended_hours(score_gap, estimated_weeks),
            'sessionsPerWeek': 4,
            'studySchedule': create_study_schedule(weaknesses)
        },
        'milestones': create_milestones(current_score, target_goal, estimated_weeks),
        'resources': recommend_study_resources(test_type, weaknesses),
        'tips': generate_study_tips(test_type, weaknesses, strengths)
    }
    
    return learning_path

def estimate_study_duration(test_type, score_gap, weaknesses):
    """Ước tính thời gian học cần thiết"""
    if test_type == 'IELTS':
        # Mỗi 0.5 band IELTS cần khoảng 8-12 tuần
        base_weeks = score_gap * 20
    else:
        # Mỗi 100 điểm TOEIC cần khoảng 8-10 tuần
        base_weeks = (score_gap / 100) * 9
    
    # Điều chỉnh dựa trên weaknesses
    weakness_multiplier = 1.0 + (len(weaknesses) * 0.1)
    
    return max(4, int(base_weeks * weakness_multiplier))

def classify_difficulty(score_gap, test_type):
    """Phân loại độ khó của mục tiêu"""
    if test_type == 'IELTS':
        if score_gap <= 0.5:
            return 'easy'
        elif score_gap <= 1.5:
            return 'medium'
        else:
            return 'hard'
    else:
        if score_gap <= 100:
            return 'easy'
        elif score_gap <= 300:
            return 'medium'
        else:
            return 'hard'

def create_learning_phases(test_type, current_score, target_score, weaknesses):
    """Tạo các giai đoạn học tập"""
    phases = []
    
    if test_type == 'IELTS':
        score_increment = 0.5
        phase_names = ['Foundation', 'Intermediate', 'Advanced', 'Mastery']
    else:
        score_increment = 100
        phase_names = ['Basic', 'Intermediate', 'Upper-Intermediate', 'Advanced']
    
    current = current_score
    phase_index = 0
    
    while current < target_score and phase_index < len(phase_names):
        next_target = min(current + score_increment, target_score)
        
        phases.append({
            'name': phase_names[phase_index],
            'startScore': current,
            'targetScore': next_target,
            'duration': f"{estimate_study_duration(test_type, next_target - current, weaknesses)//4} tuần",
            'focusSkills': get_phase_focus_skills(phase_index, weaknesses),
            'objectives': get_phase_objectives(test_type, phase_index)
        })
        
        current = next_target
        phase_index += 1
    
    return phases

def prioritize_focus_areas(weaknesses, strengths):
    """Ưu tiên các kỹ năng cần tập trung"""
    focus_areas = []
    
    # Ưu tiên weaknesses
    for weakness in weaknesses:
        focus_areas.append({
            'skill': weakness,
            'priority': 'high',
            'reason': f'Cần cải thiện {weakness.lower()}'
        })
    
    # Thêm strengths để duy trì
    for strength in strengths[:2]:  # Chỉ lấy 2 strengths hàng đầu
        focus_areas.append({
            'skill': strength,
            'priority': 'medium',
            'reason': f'Duy trì và phát triển {strength.lower()}'
        })
    
    return focus_areas

def calculate_recommended_hours(score_gap, weeks):
    """Tính số giờ học khuyến nghị mỗi tuần"""
    total_hours = score_gap * 40  # Ước tính 40 giờ cho mỗi đơn vị điểm
    return max(5, min(20, int(total_hours / weeks)))

def create_study_schedule(weaknesses):
    """Tạo lịch học khuyến nghị"""
    schedule = {
        'monday': ['Reading', 'Vocabulary'],
        'tuesday': ['Listening', 'Grammar'],
        'wednesday': ['Writing', 'Speaking'],
        'thursday': ['Reading', 'Listening'],
        'friday': ['Grammar', 'Vocabulary'],
        'saturday': ['Writing', 'Speaking'],
        'sunday': ['Review', 'Practice Test']
    }
    
    # Điều chỉnh dựa trên weaknesses
    if 'writing' in [w.lower() for w in weaknesses]:
        schedule['tuesday'].append('Writing')
        schedule['thursday'].append('Writing')
    
    return schedule

def create_milestones(current_score, target_score, weeks):
    """Tạo các mốc quan trọng"""
    milestones = []
    total_gap = target_score - current_score
    
    # Tạo 4 milestones
    for i in range(1, 5):
        milestone_score = current_score + (total_gap * i / 4)
        milestone_week = int(weeks * i / 4)
        
        milestones.append({
            'week': milestone_week,
            'targetScore': round(milestone_score, 1),
            'description': f'Đạt {round(milestone_score, 1)} điểm',
            'assessmentType': 'practice_test' if i % 2 == 0 else 'skill_check'
        })
    
    return milestones

def recommend_study_resources(test_type, weaknesses):
    """Đề xuất tài liệu học tập"""
    resources = {
        'books': [],
        'online': [],
        'apps': [],
        'practice': []
    }
    
    if test_type == 'IELTS':
        resources['books'] = ['Cambridge IELTS Series', 'IELTS Trainer', 'Target Band 7+']
        resources['online'] = ['IELTS.org', 'British Council IELTS', 'IELTSLiz']
        resources['apps'] = ['IELTS Prep App', 'IELTS Practice', 'IELTS Vocabulary']
    else:
        resources['books'] = ['Official TOEIC Guide', 'Barron\'s TOEIC', 'ETS TOEIC Practice']
        resources['online'] = ['ETS TOEIC', 'EnglishClub TOEIC', 'TOEIC Practice Online']
        resources['apps'] = ['TOEIC Test Pro', 'TOEIC Listening', 'TOEIC Vocabulary']
    
    # Thêm resources cho weaknesses
    for weakness in weaknesses:
        if weakness.lower() == 'writing':
            resources['practice'].append('Daily writing exercises')
        elif weakness.lower() == 'speaking':
            resources['practice'].append('Speaking practice with AI')
        elif weakness.lower() == 'listening':
            resources['practice'].append('Podcast listening exercises')
        elif weakness.lower() == 'reading':
            resources['practice'].append('Academic reading passages')
    
    return resources

def generate_study_tips(test_type, weaknesses, strengths):
    """Tạo tips học tập cá nhân hóa"""
    tips = []
    
    # General tips
    tips.extend([
        'Học đều đặn mỗi ngày thay vì học dồn',
        'Tạo môi trường học tập yên tĩnh và thoải mái',
        'Đặt mục tiêu nhỏ cho mỗi buổi học'
    ])
    
    # Tips based on weaknesses
    for weakness in weaknesses:
        if weakness.lower() == 'writing':
            tips.append('Luyện viết ít nhất 1 bài mỗi ngày và nhờ feedback')
        elif weakness.lower() == 'speaking':
            tips.append('Tập nói với bản thân hoặc record lại để nghe lại')
        elif weakness.lower() == 'listening':
            tips.append('Nghe podcast tiếng Anh với subtitle trước, sau đó tắt subtitle')
        elif weakness.lower() == 'reading':
            tips.append('Đọc tin tức tiếng Anh hàng ngày và ghi chú từ vựng mới')
    
    # Tips based on strengths
    for strength in strengths:
        tips.append(f'Sử dụng điểm mạnh {strength.lower()} để hỗ trợ học các kỹ năng khác')
    
    return tips[:10]  # Giới hạn 10 tips

def get_phase_focus_skills(phase_index, weaknesses):
    """Lấy kỹ năng trọng tâm cho từng giai đoạn"""
    all_skills = ['Reading', 'Listening', 'Writing', 'Speaking', 'Grammar', 'Vocabulary']
    
    if phase_index == 0:  # Foundation
        return ['Grammar', 'Vocabulary', 'Reading']
    elif phase_index == 1:  # Intermediate
        return ['Listening', 'Writing'] + [w for w in weaknesses if w in all_skills][:1]
    elif phase_index == 2:  # Advanced
        return ['Speaking', 'Writing'] + [w for w in weaknesses if w in all_skills][:1]
    else:  # Mastery
        return ['All skills integration'] + weaknesses

def get_phase_objectives(test_type, phase_index):
    """Lấy mục tiêu cho từng giai đoạn"""
    if test_type == 'IELTS':
        objectives = [
            ['Nắm vững ngữ pháp cơ bản', 'Xây dựng vốn từ vựng nền tảng'],
            ['Cải thiện kỹ năng nghe và đọc', 'Bắt đầu luyện viết cơ bản'],
            ['Phát triển kỹ năng nói và viết', 'Làm quen với format bài thi'],
            ['Tích hợp tất cả kỹ năng', 'Đạt mục tiêu điểm số']
        ]
    else:
        objectives = [
            ['Nắm vững cấu trúc câu cơ bản', 'Học từ vựng business English'],
            ['Cải thiện listening comprehension', 'Phát triển reading speed'],
            ['Nâng cao độ chính xác', 'Luyện tập với đề thi thật'],
            ['Hoàn thiện kỹ năng thi', 'Đạt target score']
        ]
    
    return objectives[min(phase_index, len(objectives) - 1)]

if __name__ == '__main__':
    # Khởi tạo model trước khi start server
    logger.info("Khởi tạo AI Explanation Service với Local Gemma-3-1b-it")
    
    if initialize_model():
        port = int(os.getenv('PORT', 5000))
        logger.info(f"Khởi động AI Explanation Service tại cổng {port}")
        app.run(host='0.0.0.0', port=port, debug=False)  # Tắt debug mode cho production
    else:
        logger.error("Không thể khởi tạo model. Vui lòng kiểm tra đường dẫn model và cấu hình.")
        exit(1)