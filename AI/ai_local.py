import os
import re
import json
import ast
import json5
import logging
import random
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS
from llama_cpp import Llama

# -------------------------------
# Cấu hình logging
# -------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------
# Flask setup
# -------------------------------
app = Flask(__name__)
CORS(app)

# -------------------------------
# Load model GGUF
# -------------------------------
llm = Llama(
    model_path="C:/Users/ADMIN/Desktop/KLTN/8_7/KLTN/AI/gemma-3-4b-it-GGUF/gemma-3-4b-it-Q4_K_M.gguf",
    n_gpu_layers=-1,     # tận dụng GPU
    n_ctx=4096,
    seed=42,
    verbose=True
)
logger.info("Model đã sẵn sàng.")

# -------------------------------
# Load difficulty mapping
# -------------------------------
from difficultyMapping import difficulty_mapping

def getDifficultyDescription(test_category, difficulty):
    if not difficulty:
        return "General level"

    try:
        # Nếu difficulty có dạng số (band/score)
        difficulty_float = float(difficulty)
        if test_category == "IELTS":
            if difficulty_float < 5.0:
                return "Beginner level (IELTS band < 5)"
            elif difficulty_float < 6.5:
                return "Intermediate level (IELTS 5.0 - 6.0)"
            elif difficulty_float < 7.5:
                return "Upper-intermediate (IELTS 6.5 - 7.0)"
            else:
                return "Advanced (IELTS 7.5+)"
        elif test_category == "TOEIC":
            if difficulty_float < 400:
                return "Beginner level (TOEIC < 400)"
            elif difficulty_float < 600:
                return "Intermediate level (TOEIC 400-600)"
            elif difficulty_float < 800:
                return "Upper-intermediate (TOEIC 600-800)"
            else:
                return "Advanced (TOEIC 800+)"
    except ValueError:
        # Không convert được float → placement test
        if "placement" in difficulty.lower():
            return f"{test_category} Placement Test - Mixed Levels"
        return "General placement difficulty"

    return "General difficulty"


def isValidDifficulty(test_category, difficulty):
    mapping = difficulty_mapping.get(test_category.upper())
    if not mapping:
        return False
    difficulty_float = float(difficulty)
    return difficulty_float in mapping

# -------------------------------
# Helper: Generate Fallback Analysis
# -------------------------------
def generate_fallback_analysis(test_type, overall_score, skill_analysis, skills_in_test, target_score_range):
    """
    Tạo dữ liệu fallback chi tiết cho AI analysis khi AI service gặp lỗi
    """
    try:
        # Xác định level dựa trên điểm số
        if overall_score >= 90:
            level = "excellent"
            achievement_level = "Xuất sắc"
        elif overall_score >= 80:
            level = "good"
            achievement_level = "Tốt"
        elif overall_score >= 70:
            level = "satisfactory"
            achievement_level = "Đạt yêu cầu"
        elif overall_score >= 60:
            level = "needs_improvement"
            achievement_level = "Cần cải thiện"
        else:
            level = "poor"
            achievement_level = "Yếu"

        # Tạo strengths dựa trên điểm số và kỹ năng
        strengths = []
        weaknesses = []
        recommendations = []
        focus_areas = []

        for skill_name, skill_data in skill_analysis.items():
            skill_score = skill_data.get('score', 0)
            if skill_score >= 80:
                strengths.append(f"Kỹ năng {skill_name} rất tốt ({skill_score:.1f}%)")
            elif skill_score >= 70:
                strengths.append(f"Kỹ năng {skill_name} khá tốt ({skill_score:.1f}%)")
            elif skill_score >= 60:
                strengths.append(f"Kỹ năng {skill_name} đạt yêu cầu ({skill_score:.1f}%)")
            else:
                weaknesses.append(f"Kỹ năng {skill_name} cần cải thiện ({skill_score:.1f}%)")
                focus_areas.append(skill_name)
                recommendations.append(f"Tập trung luyện tập {skill_name} thêm")

        # Thêm strengths/weaknesses chung
        if overall_score >= 70:
            strengths.extend([
                "Có nền tảng kiến thức vững chắc",
                "Khả năng tiếp thu tốt",
                "Tập trung học tập hiệu quả"
            ])
        else:
            weaknesses.extend([
                "Cần xây dựng nền tảng kiến thức",
                "Cần tăng cường thời gian học tập",
                "Cần phương pháp học tập hiệu quả hơn"
            ])

        # Thêm recommendations chung
        if overall_score < 70:
            recommendations.extend([
                "Luyện tập đều đặn hàng ngày ít nhất 1-2 giờ",
                "Tham gia các khóa học cơ bản để xây dựng nền tảng",
                "Làm nhiều bài tập thực hành",
                "Tìm hiểu các chiến lược làm bài hiệu quả"
            ])
        else:
            recommendations.extend([
                "Duy trì thời gian học tập đều đặn",
                "Tham gia các khóa học nâng cao",
                "Luyện tập các kỹ năng còn yếu",
                "Tham gia các bài test thực tế"
            ])

        # Xác định learning style dựa trên kỹ năng
        if 'reading' in skills_in_test and 'listening' in skills_in_test:
            learning_style = "mixed"
        elif 'reading' in skills_in_test:
            learning_style = "visual"
        elif 'listening' in skills_in_test:
            learning_style = "auditory"
        else:
            learning_style = "kinesthetic"

        # Xác định confidence level
        if overall_score >= 80:
            confidence_level = "high"
        elif overall_score >= 60:
            confidence_level = "medium"
        else:
            confidence_level = "low"

        # Xác định motivation level
        if overall_score >= 70:
            motivation_level = "high"
        elif overall_score >= 50:
            motivation_level = "medium"
        else:
            motivation_level = "low"

        # Tạo study plan
        if overall_score < 60:
            study_plan = {
                "duration": 16,
                "hoursPerWeek": 15,
                "focusAreas": focus_areas if focus_areas else list(skills_in_test)
            }
        elif overall_score < 80:
            study_plan = {
                "duration": 12,
                "hoursPerWeek": 12,
                "focusAreas": focus_areas if focus_areas else list(skills_in_test)
            }
        else:
            study_plan = {
                "duration": 8,
                "hoursPerWeek": 10,
                "focusAreas": focus_areas if focus_areas else list(skills_in_test)
            }

        # Tạo overall assessment
        target_achieved = overall_score >= 70
        overall_assessment = {
            "summary": f"Kết quả Final Test: {overall_score:.1f}% - {achievement_level}",
            "achievementLevel": "Đạt được" if target_achieved else "Chưa đạt được",
            "improvementAreas": focus_areas if focus_areas else list(skills_in_test),
            "nextSteps": [
                "Luyện tập các kỹ năng yếu" if not target_achieved else "Tham gia khóa học nâng cao",
                "Làm thêm bài tập thực hành" if not target_achieved else "Thi thử định kỳ",
                "Tham gia khóa học phù hợp" if not target_achieved else "Duy trì kết quả tốt"
            ]
        }

        # Tạo learning path
        if overall_score < 60:
            learning_path = {
                "shortTerm": ["Khóa học cơ bản", "Luyện tập nền tảng"],
                "longTerm": ["Khóa học nâng cao", "Thi thử thực tế"],
                "focusAreas": focus_areas if focus_areas else list(skills_in_test)
            }
        elif overall_score < 80:
            learning_path = {
                "shortTerm": ["Luyện tập kỹ năng yếu", "Khóa học trung cấp"],
                "longTerm": ["Khóa học nâng cao", "Thi thử định kỳ"],
                "focusAreas": focus_areas if focus_areas else list(skills_in_test)
            }
        else:
            learning_path = {
                "shortTerm": ["Khóa học nâng cao", "Luyện tập chuyên sâu"],
                "longTerm": ["Thi thử thực tế", "Đạt mục tiêu cao hơn"],
                "focusAreas": focus_areas if focus_areas else list(skills_in_test)
            }

        # Tạo study advice
        if overall_score < 60:
            study_advice = {
                "dailyPractice": "Luyện tập 2-3 giờ mỗi ngày với các bài tập cơ bản",
                "weeklyGoals": "Hoàn thành 3-4 bài học và làm 2-3 mini test",
                "monthlyMilestones": "Kiểm tra tiến độ và điều chỉnh phương pháp học tập"
            }
        elif overall_score < 80:
            study_advice = {
                "dailyPractice": "Luyện tập 1-2 giờ mỗi ngày với các bài tập nâng cao",
                "weeklyGoals": "Hoàn thành 2-3 bài học và làm 1-2 practice test",
                "monthlyMilestones": "Kiểm tra tiến độ và tham gia khóa học nâng cao"
            }
        else:
            study_advice = {
                "dailyPractice": "Luyện tập 1 giờ mỗi ngày với các bài tập chuyên sâu",
                "weeklyGoals": "Hoàn thành 1-2 bài học và làm 1 practice test",
                "monthlyMilestones": "Kiểm tra tiến độ và thi thử thực tế"
            }

        return {
            "aiAnalysis": {
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommendations": recommendations,
                "learningStyle": learning_style,
                "confidenceLevel": confidence_level,
                "motivationLevel": motivation_level,
                "studyPlan": study_plan,
                "overallAssessment": overall_assessment,
                "learningPath": learning_path,
                "studyAdvice": study_advice
            }
        }

    except Exception as e:
        logger.error(f"Error generating fallback analysis: {e}")
        # Fallback cực kỳ đơn giản nếu có lỗi
        return {
            "aiAnalysis": {
                "strengths": ["Cần phân tích chi tiết hơn"],
                "weaknesses": ["Cần cải thiện"],
                "recommendations": ["Luyện tập thêm"],
                "learningStyle": "mixed",
                "confidenceLevel": "medium",
                "motivationLevel": "medium",
                "studyPlan": {
                    "duration": 12,
                    "hoursPerWeek": 10,
                    "focusAreas": list(skills_in_test)
                },
                "overallAssessment": {
                    "summary": f"Kết quả Final Test: {overall_score:.1f}%",
                    "achievementLevel": "Cần đánh giá thêm",
                    "improvementAreas": list(skills_in_test),
                    "nextSteps": ["Luyện tập thêm"]
                },
                "learningPath": {
                    "shortTerm": ["Luyện tập cơ bản"],
                    "longTerm": ["Khóa học nâng cao"],
                    "focusAreas": list(skills_in_test)
                },
                "studyAdvice": {
                    "dailyPractice": "Luyện tập 30 phút mỗi ngày",
                    "weeklyGoals": "Hoàn thành 1 bài học mỗi tuần",
                    "monthlyMilestones": "Kiểm tra tiến độ hàng tháng"
                }
            }
        }

# -------------------------------
# Helper: Generate Fallback Recommendations
# -------------------------------
def generate_fallback_recommendations(test_type, achieved_level, available_courses, strengths, weaknesses):
    """
    Tạo dữ liệu fallback cho course recommendations khi AI service gặp lỗi
    """
    try:
        # Lấy current score từ achieved level
        current_score = 0
        if test_type.upper() == 'IELTS':
            current_score = achieved_level.get('ielts', {}).get('overall', 0)
        else:  # TOEIC
            current_score = achieved_level.get('toeic', {}).get('overall', 0)

        # Tạo suggested courses dựa trên available courses
        suggested_courses = []
        if available_courses and len(available_courses) > 0:
            # Chọn 3 khóa học đầu tiên làm fallback
            for i, course in enumerate(available_courses[:3]):
                priority = "high" if i == 0 else "medium" if i == 1 else "low"
                
                # Tạo reason dựa trên weaknesses
                if weaknesses:
                    reason = f"Giúp cải thiện {', '.join(weaknesses[:2])}"
                else:
                    reason = f"Phù hợp với trình độ hiện tại ({current_score})"
                
                suggested_courses.append({
                    "courseId": course.get('_id', course.get('courseId', f"course_{i}")),
                    "priority": priority,
                    "reason": reason,
                    "expectedOutcome": f"Nâng cao kỹ năng và đạt điểm cao hơn",
                    "timeToComplete": "2-4 tuần"
                })

        # Tạo learning path dựa trên weaknesses
        focus_areas = weaknesses if weaknesses else ["Grammar", "Vocabulary", "Reading", "Listening"]
        
        learning_path = {
            "shortTerm": [
                "Luyện tập kỹ năng yếu",
                "Tham gia khóa học cơ bản"
            ],
            "longTerm": [
                "Tham gia khóa học nâng cao",
                "Thi thử định kỳ"
            ],
            "focusAreas": focus_areas
        }

        # Tạo study advice dựa trên current score
        if current_score < 60:
            study_advice = {
                "dailyPractice": "Luyện tập 2-3 giờ mỗi ngày với các bài tập cơ bản",
                "weeklyGoals": "Hoàn thành 3-4 bài học và làm 2-3 mini test",
                "monthlyMilestones": "Kiểm tra tiến độ và điều chỉnh phương pháp học tập"
            }
        elif current_score < 80:
            study_advice = {
                "dailyPractice": "Luyện tập 1-2 giờ mỗi ngày với các bài tập nâng cao",
                "weeklyGoals": "Hoàn thành 2-3 bài học và làm 1-2 practice test",
                "monthlyMilestones": "Kiểm tra tiến độ và tham gia khóa học nâng cao"
            }
        else:
            study_advice = {
                "dailyPractice": "Luyện tập 1 giờ mỗi ngày với các bài tập chuyên sâu",
                "weeklyGoals": "Hoàn thành 1-2 bài học và làm 1 practice test",
                "monthlyMilestones": "Kiểm tra tiến độ và thi thử thực tế"
            }

        return {
            "suggestedCourses": suggested_courses,
            "learningPath": learning_path,
            "studyAdvice": study_advice
        }

    except Exception as e:
        logger.error(f"Error generating fallback recommendations: {e}")
        # Fallback cực kỳ đơn giản nếu có lỗi
        return {
            "suggestedCourses": [],
            "learningPath": {
                "shortTerm": ["Luyện tập cơ bản"],
                "longTerm": ["Khóa học nâng cao"],
                "focusAreas": ["Grammar", "Vocabulary"]
            },
            "studyAdvice": {
                "dailyPractice": "Luyện tập 30 phút mỗi ngày",
                "weeklyGoals": "Hoàn thành 1 bài học mỗi tuần",
                "monthlyMilestones": "Kiểm tra tiến độ hàng tháng"
            }
        }

# -------------------------------
# Helper: Parse model output JSON
# -------------------------------
def parse_model_output(raw_text: str):
    if not raw_text:
        return None
    try:
        cleaned = raw_text.strip()

        # Nếu có block ```json ... ```
        if "```" in cleaned:
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL | re.IGNORECASE)
            if match:
                cleaned = match.group(1).strip()

        # Nếu vẫn có nhiều text → chỉ lấy đoạn JSON array hoặc object
        match = re.search(r"(\[.*\]|\{.*\})", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1)

        # Nếu model trả về object thay vì list → bọc lại
        if cleaned.strip().startswith("{"):
            cleaned = "[" + cleaned + "]"

        return json.loads(cleaned)

    except Exception as e:
        logger.warning(f"⚠️ parse_model_output failed: {e} | sample: {raw_text[:200]}")
        return None

# -------------------------------
# Hàm chọn độ khó
# -------------------------------
def pick_difficulty(mode, fixed_difficulty, difficulty_range, question_index, total_questions):
    if mode == "fixed":
        return fixed_difficulty

    if mode == "range":
        easy_cutoff = int(total_questions * 0.3)
        medium_cutoff = int(total_questions * 0.7)

        if question_index < easy_cutoff:
            return random.choice(difficulty_range.get("easy", ["4.0", "4.5", "5.0"]))
        elif question_index < medium_cutoff:
            return random.choice(difficulty_range.get("medium", ["5.5", "6.0", "6.5"]))
        else:
            return random.choice(difficulty_range.get("hard", ["7.0", "7.5", "8.0"]))

# -------------------------------
# API: Giải thích câu trả lời
# -------------------------------
@app.route('/api/explain', methods=['POST'])
def explain():
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu giải thích: {data}")

        required_fields = ['question', 'options', 'student_answer', 'correct_answer', 'question_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        if data['question_type'] not in ['multiple-choice', 'true-false']:
            return jsonify({
                'error': 'Loại câu hỏi không hợp lệ',
                'status': 400
            }), 400

        question = data['question']
        options = data.get('options') or []
        student_answer_raw = str(data['student_answer']).strip()
        correct_answer_raw = str(data['correct_answer']).strip()

        # Ánh xạ index -> (letter, text)
        def map_answer(ans_raw):
            # Nếu là số index
            if ans_raw.isdigit() and options:
                idx = int(ans_raw)
                if 0 <= idx < len(options):
                    letter = chr(65 + idx)  # 0->A
                    text = options[idx]
                    return letter, text
            # Nếu là chữ cái A-D
            if len(ans_raw) == 1 and ans_raw.upper() in ['A','B','C','D'] and options:
                idx = ord(ans_raw.upper()) - 65
                if 0 <= idx < len(options):
                    return ans_raw.upper(), options[idx]
            # Nếu là text, cố gắng tìm trong options
            if options:
                for i, opt in enumerate(options):
                    if opt.strip().lower() == ans_raw.strip().lower():
                        return chr(65 + i), opt
            # Fallback
            return ans_raw, ans_raw

        stu_letter, stu_text = map_answer(student_answer_raw)
        cor_letter, cor_text = map_answer(correct_answer_raw)

        # Chuẩn hóa danh sách option có tiền tố A./B./...
        formatted_options = []
        for i, opt in enumerate(options):
            formatted_options.append(f"{chr(65+i)}. {opt}")

        # Chuẩn bị block hiển thị lựa chọn, tránh backslash trong biểu thức f-string
        if formatted_options:
            options_block = "- " + "\n- ".join(formatted_options)
        else:
            options_block = "(Không có)"

        # Tạo prompt giải thích (rõ ràng theo chữ cái và nội dung)
        prompt = f"""
Câu hỏi: {question}
Các lựa chọn:
{options_block}
Học sinh chọn: {stu_letter} ({stu_text})
Đáp án đúng: {cor_letter} ({cor_text})

Hãy giải thích ngắn gọn bằng tiếng Việt vì sao đáp án {cor_letter} ({cor_text}) là chính xác, và tại sao các phương án còn lại không đúng.
        """

        output = llm(prompt, max_tokens=512, stop=["</s>"])
        explanation = output["choices"][0]["text"].strip()

        return jsonify({
            "explanation": explanation,
            "status": 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi xử lý explain: {str(e)}", exc_info=True)
        return jsonify({"error": "Lỗi hệ thống", "status": 500}), 500

# -------------------------------
# API: Sinh câu hỏi
# -------------------------------
@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        test_category = data.get("test_category", "IELTS")
        test_type = data.get("test_type", "placement")
        difficulty = data.get("difficulty")
        num_questions = data.get("num_questions", 5)
        question_types = data.get("question_types", [
            "multiple-choice", "true-false-notgiven",
            "yes-no-notgiven", "fill-in-blank", "short-answer", "writing-task"
        ])
        skill = data.get("skill", None)  # reading, listening, writing...

        if not difficulty or not isValidDifficulty(test_category, difficulty):
            return jsonify({
                "error": f"Độ khó không hợp lệ cho {test_category}",
                "status": 400
            }), 400

        description = getDifficultyDescription(test_category, difficulty)
        questions = []

        # ==============================
        # 1. WRITING TASK MODE
        # ==============================
        if skill == "writing" or "writing-task" in question_types:
            for i in range(num_questions):
                prompt = f"""
Bạn là giảng viên tiếng Anh.
Tạo 1 đề Writing cho {test_category} ở độ khó {difficulty} ({description}).
Chỉ trả JSON hợp lệ theo mẫu:

[
  {{
    "questionType": "writing-task",
    "taskType": "ielts-task2", 
    "questionText": "Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?",
    "wordLimit": 250,
    "instructions": "Give reasons for your answer and include relevant examples.",
  }}
]
"""
            output = llm(prompt, max_tokens=1024, stop=["</s>"])
            raw_text = output["choices"][0]["text"].strip()

            q_list = parse_model_output(raw_text)
            if q_list and len(q_list) > 0:
                questions.append(q_list[0])  # writing-task giữ nguyên
            else:
                questions.append({"raw_output": raw_text})

        # ==============================
        # 2. PASSAGE-BASED MODE (Reading/Listening)
        # ==============================
        elif skill in ["reading", "listening"]:
            passage_prompt = f"""
Bạn là giảng viên tiếng Anh.
Hãy viết một đoạn văn {skill} dài khoảng 120-150 từ,
phù hợp với {test_category}, độ khó {difficulty} ({description}).
Chỉ trả về đoạn văn, không giải thích.
"""
            passage_output = llm(passage_prompt, max_tokens=512, stop=["</s>"])
            passage_text = passage_output["choices"][0]["text"].strip()
            passage_text = passage_text.replace("---", "").strip()

            questions_prompt = f"""
Dựa vào đoạn văn sau, hãy tạo {num_questions} câu hỏi dạng {", ".join(question_types)}.
Đoạn văn: {passage_text}

Output JSON hợp lệ theo mẫu:
[
  {{
    "passageText": "{passage_text}",
    "questionType": "multiple-choice",
    "questionText": "What is the main idea of the passage?",
    "options": ["A...", "B...", "C...", "D..."],
    "correctAnswer": "B"
  }}
]
Chỉ trả JSON hợp lệ, không có giải thích thêm.
"""
            output = llm(questions_prompt, max_tokens=1024, stop=["</s>"])
            raw_text = output["choices"][0]["text"].strip()

            q_list = parse_model_output(raw_text)
            if q_list:
                for q in q_list:
                    questions.append({
                        "questionType": q.get("questionType"),
                        "questionText": q.get("questionText"),
                        "options": q.get("options", []),
                        "correctAnswer": q.get("correctAnswer"),
                        "passageText": passage_text
                    })
            else:
                questions.append({"raw_output": raw_text})

        # ==============================
        # 3. SINGLE QUESTION MODE (Grammar, Vocab...)
        # ==============================
        else:
            for i in range(num_questions):
                q_type = question_types[i % len(question_types)]

                if q_type == "fill-in-blank":
                    prompt = f"""
Bạn là giảng viên tiếng Anh.
Tạo 1 câu hỏi dạng {q_type} cho {test_category} ở độ khó {difficulty} ({description}).
Câu hỏi phải có một chỗ trống (dùng ký hiệu ____).
Nếu có options thì chúng phải phù hợp để điền vào chỗ trống.

Output JSON:
[
  {{
    "questionType": "{q_type}",
    "questionText": "The Industrial Revolution began in ____.",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "..."
  }}
]
Chỉ trả JSON hợp lệ, không giải thích thêm.
"""
                else:
                    prompt = f"""
Bạn là giảng viên tiếng Anh.
Tạo 1 câu hỏi dạng {q_type} cho {test_category} ở độ khó {difficulty} ({description}).
Đây là bài {test_type}.

Yêu cầu output JSON hợp lệ theo mẫu:
[
  {{
    "questionType": "{q_type}",
    "questionText": "Câu hỏi...",
    "options": ["A...", "B...", "C...", "D..."],   // nếu có
    "correctAnswer": "..."
  }}
]
Chỉ trả về JSON hợp lệ, không có giải thích thêm.
"""
                output = llm(prompt, max_tokens=512, stop=["</s>", "Explanation", "Notes"])
                raw_text = output["choices"][0]["text"].strip()

                q_list = parse_model_output(raw_text)
                if q_list and isinstance(q_list, list) and len(q_list) > 0:
                    questions.append(q_list[0])
                else:
                    questions.append({"raw_output": raw_text})

        return jsonify({
            "questions": questions,
            "status": 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi sinh câu hỏi: {str(e)}", exc_info=True)
        return jsonify({"error": "Lỗi hệ thống", "status": 500}), 500

# -------------------------------
# API: Sinh đề placement test
# -------------------------------
@app.route('/api/generate-test', methods=['POST'])
def generate_test():
    try:
        data = request.json

        # Loại test: placement / final
        test_type = data.get("testType", "placement")  # "placement" | "final"
        test_category = data.get("test_category", "IELTS")

        # Các kỹ năng được chọn
        skills = data.get("skillsCovered", ["reading", "writing"])
        skills_label = " + ".join([s.capitalize() for s in skills])

        # Nếu placement → nhãn test = "IELTS Placement (Reading + Writing)"
        # Nếu final → nhãn test = "IELTS Final Test (Reading + Writing, Target 6.0)"
        target_score = data.get("targetScore", None)

        if test_type == "placement":
            test_label = f"{test_category} Placement ({skills_label})"
            difficultyRange = data.get("difficultyRange", {
                "easy": ["4.0", "4.5", "5.0"],
                "medium": ["5.5", "6.0", "6.5"],
                "hard": ["7.0", "7.5", "8.0"]
            })
        else:  # final test
            test_label = f"{test_category} Final Test ({skills_label}, Target {target_score})"
            # final test → difficulty tập trung quanh target_score
            difficultyRange = {
                "easy": [target_score],
                "medium": [target_score],
                "hard": [target_score]
            }

        # Sections: mỗi skill có phân phối số lượng câu hỏi
        sections = data.get("sections", [])

        all_questions = []
        q_index = 0

        # Xử lý từng section
        for section in sections:
            skill = section.get("skill")
            distribution = section.get("distribution", {})

            # Nếu Reading/Listening → cần passage chung
            passage_text = None
            if skill and skill.lower() in ["reading", "listening"]:
                passage_prompt = f"""
Bạn là giảng viên tiếng Anh.
Hãy viết một đoạn văn {skill} dài khoảng 120-150 từ,
phù hợp với {test_category}.
Chỉ trả về đoạn văn, không giải thích.
"""
                passage_output = llm(passage_prompt, max_tokens=512, stop=["</s>"])
                passage_text = passage_output["choices"][0]["text"].strip()
                passage_text = passage_text.replace("---", "").strip()

            # Sinh từng loại câu hỏi trong section
            for q_type, required in distribution.items():
                created = 0
                attempts = 0
                max_attempts = 5  # batch retry tối đa

                while created < required and attempts < max_attempts:
                    attempts += 1

                    current_difficulty = pick_difficulty(
                        "range", test_label, difficultyRange,
                        q_index, sum(distribution.values())
                    )
                    q_index += required
                    description = getDifficultyDescription(test_category, current_difficulty)
                    remaining = required - created

                    # Prompt batch
                    if q_type in ["writing-task", "essay", "summary", "short-answer"]:
                        prompt = f"""
Bạn là giảng viên tiếng Anh.
Tạo {remaining} đề Writing dạng {q_type} cho {test_category} ({skills_label})
ở độ khó {current_difficulty} ({description}).

Output JSON hợp lệ (list):
[
  {{
    "questionType":"{q_type}",
    "questionText":"Đề bài writing...",
    "wordLimit": 250,
    "instructions":"Hướng dẫn viết bài",
    "difficulty":"{current_difficulty}"
  }}
]

Lưu ý: Writing không cần options, correctAnswer, passageText.
"""
                    elif skill and skill.lower() in ["reading", "listening"]:
                        prompt = f"""
Dựa vào đoạn văn sau, hãy tạo {remaining} câu hỏi dạng {q_type}.
Đoạn văn: {passage_text}

Output JSON hợp lệ (list):
[
  {{
    "questionType":"{q_type}",
    "questionText":"...",
    "options":["A...","B..."],
    "correctAnswer":"B",
    "passageText":"{passage_text}",
    "difficulty":"{current_difficulty}"
  }}
]
"""
                    elif q_type == "short-answer":
                        prompt = f"""
Bạn là giảng viên tiếng Anh.
Tạo {remaining} câu hỏi dạng {q_type} cho {test_category} ({skills_label})
ở độ khó {current_difficulty} ({description}).
Đây là câu hỏi writing, không cần options hay correctAnswer.

Output JSON hợp lệ (list):
[
  {{
    "questionType":"short-answer",
    "questionText":"Câu hỏi ngắn để học sinh trả lời bằng 1-2 câu",
    "wordLimit": 50,
    "instructions":"Trả lời ngắn gọn trong 1-2 câu",
    "difficulty":"{current_difficulty}"
  }}
]

Lưu ý: Short-answer là writing, không cần options, correctAnswer, passageText.
"""
                    elif q_type == "fill-in-blank":
                        prompt = f"""
Bạn là giảng viên tiếng Anh.
Tạo {remaining} câu hỏi dạng {q_type} cho {test_category} ({skills_label})
ở độ khó {current_difficulty} ({description}).
Mỗi câu phải có một chỗ trống (____).

Output JSON hợp lệ (list):
[
  {{
    "questionType":"fill-in-blank",
    "questionText":"The Industrial Revolution began in ____.",
    "options":["A. ...","B. ..."],
    "correctAnswer":"B",
    "difficulty":"{current_difficulty}"
  }}
]
"""
                    else:
                        prompt = f"""
Bạn là giảng viên tiếng Anh.
Tạo {remaining} câu hỏi dạng {q_type} cho {test_category} ({skills_label})
ở độ khó {current_difficulty} ({description}).

Output JSON hợp lệ (list):
[
  {{
    "questionType":"{q_type}",
    "questionText":"...",
    "options":["A...","B..."],
    "correctAnswer":"B",
    "difficulty":"{current_difficulty}"
  }}
]
"""

                    # Gọi model
                    output = llm(prompt, max_tokens=2048, stop=["</s>"])
                    raw_text = output["choices"][0]["text"].strip()
                    q_list = parse_model_output(raw_text)

                    if not q_list:
                        logger.warning(f"⚠️ JSON parse lỗi cho {q_type} ({skill}), thử batch lại... ({attempts}/{max_attempts})")
                        continue

                    for q in q_list:
                        if created >= required:
                            break
                        q["section"] = skill
                        q["difficulty"] = current_difficulty
                        
                        # Xử lý đặc biệt cho writing
                        if q_type in ["writing-task", "essay", "summary", "short-answer"]:
                            # Writing không cần options, correctAnswer, passageText
                            q.pop("options", None)
                            q.pop("correctAnswer", None)
                            q.pop("passageText", None)
                        elif skill and skill.lower() in ["reading", "listening"]:
                            q["passageText"] = passage_text
                            
                        all_questions.append(q)
                        created += 1
                        logger.info(f"✅ Đã tạo {created}/{required} câu {q_type} ({skill})")

                if created < required:
                    logger.warning(f"⚠️ Chỉ tạo được {created}/{required} câu {q_type} ({skill}) sau {attempts} batch")

        return jsonify({
            "testType": test_type,
            "testCategory": test_category,
            "testLabel": test_label,
            "skillsCovered": skills,
            "difficultyRange": difficultyRange,
            "targetScore": target_score if test_type == "final" else None,
            "totalQuestions": len(all_questions),
            "questions": all_questions,
            "status": 200
        })

    except Exception as e:
        logger.error(f"❌ Lỗi khi sinh test: {str(e)}", exc_info=True)
        return jsonify({"error": "Lỗi hệ thống", "status": 500}), 500

# -------------------------------
# API: Đánh giá kết quả Placement Test
# -------------------------------
@app.route('/api/evaluate-placement', methods=['POST'])
def evaluate_placement():
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đánh giá placement test: {data}")

        required_fields = ['testType', 'answers', 'questions', 'userGoals']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        test_type = data['testType']  # IELTS hoặc TOEIC
        answers = data['answers']  # Danh sách câu trả lời của user
        questions = data['questions']  # Danh sách câu hỏi
        user_goals = data['userGoals']  # Mục tiêu của user

        # Khởi tạo skill analysis từ backend scores nếu có
        skill_analysis = {}
        if 'scores' in data:
            backend_scores = data['scores']
            logger.info(f"Using backend scores: {backend_scores}")
            
            # Sử dụng kết quả từ backend
            if 'reading' in backend_scores:
                skill_analysis['reading'] = {
                    'correct': backend_scores['reading'].get('raw', 0),
                    'total': 0,  # Sẽ tính từ questions
                    'strengths': [],
                    'weaknesses': []
                }
            
            if 'listening' in backend_scores:
                skill_analysis['listening'] = {
                    'correct': backend_scores['listening'].get('raw', 0),
                    'total': 0,
                    'strengths': [],
                    'weaknesses': []
                }
            
            if 'writing' in backend_scores:
                skill_analysis['writing'] = {
                    'correct': 0,  # Writing sẽ được AI đánh giá
                    'total': 0,
                    'strengths': [],
                    'weaknesses': []
                }
            
            if 'speaking' in backend_scores:
                skill_analysis['speaking'] = {
                    'correct': backend_scores['speaking'].get('raw', 0),
                    'total': 0,
                    'strengths': [],
                    'weaknesses': []
                }
        else:
            # Fallback: khởi tạo skill analysis mặc định
            skill_analysis = {
                'reading': {'correct': 0, 'total': 0, 'strengths': [], 'weaknesses': []},
                'listening': {'correct': 0, 'total': 0, 'strengths': [], 'weaknesses': []},
                'writing': {'correct': 0, 'total': 0, 'strengths': [], 'weaknesses': []},
                'speaking': {'correct': 0, 'total': 0, 'strengths': [], 'weaknesses': []}
            }

        # Đếm tổng số câu hỏi theo từng kỹ năng
        skills_in_test = set()  # Thêm dòng này để định nghĩa biến
        for question in questions:
            question_type = question.get('questionType', '').lower()
            if 'reading' in question_type or 'grammar' in question_type or 'vocabulary' in question_type:
                if 'reading' in skill_analysis:
                    skill_analysis['reading']['total'] += 1
                skills_in_test.add('reading')
            elif 'listening' in question_type:
                if 'listening' in skill_analysis:
                    skill_analysis['listening']['total'] += 1
                skills_in_test.add('listening')
            elif 'writing' in question_type or 'essay' in question_type or 'summary' in question_type or 'short-answer' in question_type:
                if 'writing' in skill_analysis:
                    skill_analysis['writing']['total'] += 1
                skills_in_test.add('writing')
            elif 'speaking' in question_type:
                if 'speaking' in skill_analysis:
                    skill_analysis['speaking']['total'] += 1
                skills_in_test.add('speaking')

        # Tính tổng điểm từ backend scores
        total_correct = sum(skill.get('correct', 0) for skill in skill_analysis.values())
        total_questions = sum(skill.get('total', 0) for skill in skill_analysis.values())
        
        if total_questions > 0:
            overall_score = (total_correct / total_questions) * 100
        else:
            overall_score = 0

        logger.info(f"AI Score Calculation (using backend scores):")
        logger.info(f"  Total questions: {total_questions}")
        logger.info(f"  Total correct: {total_correct}")
        logger.info(f"  Overall score: {overall_score}%")
        logger.info(f"  Skill analysis: {skill_analysis}")

        # Thu thập writing answers để đánh giá AI
        writing_answers = []
        for i, answer in enumerate(answers):
            if i < len(questions):
                question = questions[i]
                question_type = question.get('questionType', '').lower()
                user_answer = answer.get('userAnswer', '').strip()
                
                # Kiểm tra các loại writing khác nhau
                if (question_type in ['writing', 'essay', 'summary', 'short-answer'] or 
                    'writing' in question_type or 'essay' in question_type or 
                    'summary' in question_type or 'short-answer' in question_type):
                    writing_answers.append({
                        'question': question.get('questionText', ''),
                        'answer': user_answer,
                        'type': question_type,
                        'wordLimit': question.get('wordLimit', 250)
                    })
                    logger.info(f"Writing answer collected: {user_answer[:100]}...")

        # Tạo AI analysis prompt
        ai_analysis_prompt = f"""
        Phân tích kết quả placement test IELTS với các thông tin sau:
        
        - Tổng số câu hỏi: {total_questions}
        - Số câu đúng: {total_correct}
        - Điểm tổng thể: {overall_score:.1f}%
        - Phân tích từng kỹ năng: {skill_analysis}
        
        Writing answers ({len(writing_answers)} câu):
        {chr(10).join([f"- Câu {i+1}: {w['answer'][:200]}..." for i, w in enumerate(writing_answers)])}
        
        Mục tiêu của học sinh: {user_goals}
        
        Hãy đưa ra:
        1. Đánh giá tổng quan về trình độ hiện tại
        2. Phân tích điểm mạnh và điểm yếu
        3. Đề xuất lộ trình học tập
        4. Gợi ý cải thiện cụ thể
        """

        # Chuyển đổi sang band/score theo loại test
        if test_type.upper() == 'IELTS':
            if overall_score >= 90:
                estimated_band = 8.5
            elif overall_score >= 80:
                estimated_band = 7.5
            elif overall_score >= 70:
                estimated_band = 6.5
            elif overall_score >= 60:
                estimated_band = 5.5
            elif overall_score >= 50:
                estimated_band = 4.5
            else:
                estimated_band = 3.5
        else:  # TOEIC
            if overall_score >= 90:
                estimated_score = 900
            elif overall_score >= 80:
                estimated_score = 800
            elif overall_score >= 70:
                estimated_score = 700
            elif overall_score >= 60:
                estimated_score = 600
            elif overall_score >= 50:
                estimated_score = 500
            else:
                estimated_score = 400

        # Đánh giá writing nếu có
        writing_evaluation = ""
        writing_score = 0
        correct_answers = total_correct  # Thêm dòng này để định nghĩa biến
        logger.info(f"Writing answers collected: {len(writing_answers)}")
        if writing_answers:
            writing_prompt = f"""
Bạn là chuyên gia đánh giá writing tiếng Anh.
Hãy đánh giá các bài writing sau theo thang điểm IELTS (0-9):

{json.dumps(writing_answers, indent=2, ensure_ascii=False)}

Đánh giá theo 4 tiêu chí IELTS Writing:
1. Task Achievement (25%)
2. Coherence and Cohesion (25%) 
3. Lexical Resource (25%)
4. Grammatical Range and Accuracy (25%)

**Lưu ý quan trọng:**
- Điểm tổng thể (overallScore) phải là số từ 0-9
- Không được vượt quá 9 điểm
- Đánh giá công bằng và chính xác

Trả về JSON:
{{
  "overallScore": 0-9,
  "taskAchievement": {{"score": 0-9, "feedback": "..."}},
  "coherenceCohesion": {{"score": 0-9, "feedback": "..."}},
  "lexicalResource": {{"score": 0-9, "feedback": "..."}},
  "grammaticalAccuracy": {{"score": 0-9, "feedback": "..."}},
  "generalFeedback": "Đánh giá tổng quan"
}}

Chỉ trả về JSON hợp lệ, không có giải thích thêm.
"""
            try:
                writing_output = llm(writing_prompt, max_tokens=1024, stop=["</s>"])
                writing_evaluation = writing_output["choices"][0]["text"].strip()
                
                logger.info(f"Writing evaluation raw: {writing_evaluation}")
                
                # Parse writing score
                writing_analysis = parse_model_output(writing_evaluation)
                logger.info(f"Writing analysis parsed: {writing_analysis}")
                
                if writing_analysis and isinstance(writing_analysis, list) and len(writing_analysis) > 0:
                    writing_data = writing_analysis[0]
                    if 'overallScore' in writing_data:
                        writing_score = float(writing_data['overallScore'])
                        # Chuyển đổi IELTS band (0-9) sang percentage (0-100)
                        writing_percentage = (writing_score / 9.0) * 100
                        # Giới hạn điểm trong khoảng 0-100
                        writing_percentage = max(0, min(100, writing_percentage))
                        # Cập nhật điểm writing trong skill analysis
                        if 'writing' in skill_analysis:
                            skill_analysis['writing']['correct'] = writing_percentage
                            # Không thêm writing vào tổng điểm vì đây là đánh giá riêng
                        logger.info(f"Writing score: {writing_score} -> {writing_percentage}%")
                    else:
                        logger.warning(f"No overallScore in writing_data: {writing_data}")
                else:
                    logger.warning(f"Writing analysis parse failed: {writing_analysis}")
            except Exception as e:
                logger.warning(f"Không thể đánh giá writing: {e}")
                writing_evaluation = "Không thể đánh giá writing"
                # Fallback: cho điểm trung bình cho writing
                if 'writing' in skill_analysis:
                    skill_analysis['writing']['correct'] = 50  # 50%
                    # Không thêm vào tổng điểm

        # Tạo prompt cho AI phân tích
        skills_list = list(skills_in_test)
        skills_text = ", ".join(skills_list)
        
        prompt = f"""
Bạn là chuyên gia đánh giá trình độ tiếng Anh.
Dựa trên kết quả placement test, hãy phân tích và đưa ra đánh giá chi tiết:

**Thông tin test:**
- Loại test: {test_type}
- Kỹ năng được kiểm tra: {skills_text}
- Tổng câu hỏi: {total_questions}
- Câu đúng (không tính writing): {correct_answers}
- Điểm tổng thể: {overall_score:.1f}%
- Trình độ ước tính: {estimated_band if test_type.upper() == 'IELTS' else estimated_score}

**Phân tích kỹ năng được kiểm tra:**
{json.dumps(skill_analysis, indent=2, ensure_ascii=False)}

**Đánh giá Writing (nếu có):**
{writing_evaluation}

**Mục tiêu của học sinh:**
{json.dumps(user_goals, indent=2, ensure_ascii=False)}

**Lưu ý quan trọng:**
- Chỉ phân tích các kỹ năng được kiểm tra trong test: {skills_text}
- Không đưa ra đánh giá về các kỹ năng không có trong test
- Tập trung vào điểm mạnh và điểm yếu của các kỹ năng được kiểm tra
- Writing được đánh giá riêng bằng AI, không tính vào điểm tổng thể
- Điểm Reading/Listening dựa trên số câu đúng thực tế

Hãy trả về JSON với cấu trúc:
{{
  "overallAssessment": {{
    "estimatedLevel": {estimated_band if test_type.upper() == 'IELTS' else estimated_score},
    "confidence": "high/medium/low",
    "summary": "Đánh giá tổng quan về trình độ"
  }},
  "skillAnalysis": {{
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
    "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"]
  }},
  "learningPath": {{
    "currentLevel": "Mô tả trình độ hiện tại",
    "targetLevel": "Mô tả mục tiêu",
    "estimatedDuration": "Thời gian ước tính",
    "focusAreas": ["Kỹ năng cần tập trung 1", "Kỹ năng cần tập trung 2"]
  }},
  "learningStyle": "visual/auditory/kinesthetic/mixed",
  "motivationLevel": "low/medium/high",
  "studyPlan": {{
    "duration": 12,
    "hoursPerWeek": 10,
    "focusAreas": ["Kỹ năng cần tập trung 1", "Kỹ năng cần tập trung 2"]
  }}
}}
"""

        output = llm(prompt, max_tokens=2048, stop=["</s>"])
        raw_text = output["choices"][0]["text"].strip()
        
        # Parse kết quả AI
        ai_analysis = parse_model_output(raw_text)
        if not ai_analysis:
            ai_analysis = {
                "overallAssessment": {
                    "estimatedLevel": estimated_band if test_type.upper() == 'IELTS' else estimated_score,
                    "confidence": "medium",
                    "summary": f"Trình độ {test_type} hiện tại: {estimated_band if test_type.upper() == 'IELTS' else estimated_score}"
                },
                "skillAnalysis": {
                    "strengths": ["Cần phân tích chi tiết hơn"],
                    "weaknesses": ["Cần cải thiện"],
                    "recommendations": ["Luyện tập thêm"]
                },
                "learningPath": {
                    "currentLevel": f"Trình độ {test_type} hiện tại",
                    "targetLevel": "Mục tiêu học tập",
                    "estimatedDuration": "3-6 tháng",
                    "focusAreas": list(skills_in_test)
                },
                "learningStyle": "mixed",
                "motivationLevel": "medium",
                "studyPlan": {
                    "duration": 12,
                    "hoursPerWeek": 10,
                    "focusAreas": list(skills_in_test)
                }
            }

        # Tạo response với kết quả đã tính
        response_data = {
            'status': 200,
            'testType': test_type,
            'totalQuestions': total_questions,
            'correctAnswers': total_correct,  # Sử dụng từ backend scores
            'overallScore': overall_score,
            'totalScore': overall_score,  # Thêm totalScore cho backend
            'estimatedLevel': estimated_band if test_type.upper() == 'IELTS' else estimated_score,
            'skillAnalysis': skill_analysis,
            'aiAnalysis': ai_analysis
        }
        
        logger.info(f"Final AI Response: {response_data}")
        
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Lỗi khi đánh giá placement test: {str(e)}", exc_info=True)
        return jsonify({"error": "Lỗi hệ thống", "status": 500}), 500

# -------------------------------
# API: Đề xuất khóa học
# -------------------------------
@app.route('/api/recommend-courses', methods=['POST'])
def recommend_courses():
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đề xuất khóa học: {data}")

        required_fields = ['testType', 'estimatedLevel', 'userGoals', 'availableCourses']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        test_type = data['testType']
        estimated_level = data['estimatedLevel']
        user_goals = data['userGoals']
        available_courses = data['availableCourses']
        strengths = data.get('strengths', [])
        weaknesses = data.get('weaknesses', [])

        # Tạo prompt cho AI đề xuất
        prompt = f"""
Bạn là chuyên gia tư vấn khóa học tiếng Anh.
Dựa trên kết quả placement test và mục tiêu của học sinh, hãy đề xuất khóa học phù hợp:

**Thông tin học sinh:**
- Loại test: {test_type}
- Trình độ hiện tại: {estimated_level}
- Mục tiêu: {json.dumps(user_goals, indent=2, ensure_ascii=False)}
- Điểm mạnh: {strengths}
- Điểm yếu: {weaknesses}

**Danh sách khóa học có sẵn:**
{json.dumps(available_courses, indent=2, ensure_ascii=False)}

**Yêu cầu:**
1. Chọn ít nhất 3 khóa học phù hợp nhất từ danh sách trên
2. Sử dụng courseId chính xác từ danh sách
3. Đưa ra lý do cụ thể cho mỗi khóa học

Hãy trả về JSON với cấu trúc:
{{
  "recommendations": [
    {{
      "courseId": "68a20a31ffe1a7fb161e2d55",
      "priority": "high",
      "reason": "Khóa học này phù hợp với trình độ hiện tại và giúp xây dựng nền tảng",
      "expectedOutcome": "Đạt được trình độ 4.0-5.0 IELTS",
      "timeToComplete": "3-4 tháng"
    }},
    {{
      "courseId": "68a209e1ffe1a7fb161e2d43", 
      "priority": "medium",
      "reason": "Tập trung vào kỹ năng listening cần thiết",
      "expectedOutcome": "Cải thiện listening từ 0% lên 60%",
      "timeToComplete": "2-3 tháng"
    }}
  ],
  "learningPath": {{
    "shortTerm": ["IELTS Foundation", "IELTS Listening"],
    "longTerm": ["IELTS Intensive", "IELTS Full Test"],
    "focusAreas": ["Ngữ pháp cơ bản", "Từ vựng", "Listening"]
  }},
  "studyAdvice": {{
    "dailyPractice": "Luyện tập 30 phút mỗi ngày với các bài tập cơ bản",
    "weeklyGoals": "Hoàn thành 1 bài học và làm 1 mini test",
    "monthlyMilestones": "Kiểm tra tiến độ và điều chỉnh lộ trình"
  }}
}}

**Lưu ý:** Chỉ trả về JSON hợp lệ, không có giải thích thêm.
"""

        output = llm(prompt, max_tokens=2048, stop=["</s>"])
        raw_text = output["choices"][0]["text"].strip()
        
        logger.info(f"AI raw response: {raw_text}")
        
        # Parse kết quả AI
        ai_recommendations = parse_model_output(raw_text)
        logger.info(f"Parsed recommendations: {ai_recommendations}")
        
        if not ai_recommendations:
            logger.warning("AI response parsing failed, using fallback")
            ai_recommendations = {
                "recommendations": [],
                "learningPath": {
                    "shortTerm": [],
                    "longTerm": [],
                    "focusAreas": []
                },
                "studyAdvice": {
                    "dailyPractice": "Luyện tập 30 phút mỗi ngày",
                    "weeklyGoals": "Hoàn thành 1 bài học mỗi tuần",
                    "monthlyMilestones": "Kiểm tra tiến độ hàng tháng"
                }
            }

        return jsonify({
            "testType": test_type,
            "estimatedLevel": estimated_level,
            "recommendations": ai_recommendations,
            "status": 200
        })

    except Exception as e:
        logger.error(f"Lỗi khi đề xuất khóa học: {str(e)}", exc_info=True)
        return jsonify({"error": "Lỗi hệ thống", "status": 500}), 500

# -------------------------------
# Helper Functions cho Final Test
# -------------------------------
def evaluateFinalTestWithAI(result):
    """
    Đánh giá Final Test bằng AI
    """
    try:
        import requests
        
        # Chuẩn bị dữ liệu cho AI
        data = {
            'testType': result.get('testType', 'IELTS'),
            'scores': result.get('scores', {}),
            'totalScore': result.get('totalScore', {}),
            'answers': result.get('answers', []),
            'targetScoreRange': result.get('targetScoreRange', '6.0-7.0')
        }
        
        # Gọi AI service
        response = requests.post('http://localhost:5000/api/evaluate-final-test', 
                               json=data, timeout=30)
        
        if response.status_code == 200:
            ai_analysis = response.json()
            logger.info(f"✅ AI evaluation completed for Final Test")
            return ai_analysis
        else:
            logger.warning(f"⚠️ AI evaluation failed: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"❌ AI evaluation error: {str(e)}")
        return None

def generateNextCourseRecommendations(result):
    """
    Tạo đề xuất khóa học tiếp theo
    """
    try:
        import requests
        
        # Chuẩn bị dữ liệu cho AI
        data = {
            'testType': result.get('testType', 'IELTS'),
            'achievedLevel': result.get('estimatedLevel', {}),
            'currentCourseId': result.get('courseId'),
            'strengths': result.get('aiAnalysis', {}).get('strengths', []),
            'weaknesses': result.get('aiAnalysis', {}).get('weaknesses', []),
            'availableCourses': []  # Sẽ được populate từ backend
        }
        
        # Gọi AI service
        response = requests.post('http://localhost:5000/api/recommend-next-courses', 
                               json=data, timeout=30)
        
        if response.status_code == 200:
            recommendations = response.json()
            logger.info(f"✅ Course recommendations generated for Final Test")
            return recommendations
        else:
            logger.warning(f"⚠️ Course recommendations failed: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"❌ Course recommendations error: {str(e)}")
        return None

def checkTargetAchievement(result):
    """
    Kiểm tra xem user có đạt được mục tiêu không
    """
    try:
        target_score_range = result.get('targetScoreRange', '6.0-7.0')
        achieved_score = result.get('totalScore', {}).get('percentage', 0)
        
        # Parse target score range (e.g., "6.0-7.0")
        min_target, max_target = map(float, target_score_range.split('-'))
        
        # Kiểm tra target achievement
        target_achieved = achieved_score >= min_target * 10  # Convert to percentage
        personal_target_achieved = achieved_score >= max_target * 10
        
        logger.info(f"✅ Target achievement checked: {target_achieved}, Personal: {personal_target_achieved}")
        
        return {
            'targetAchieved': target_achieved,
            'personalTargetAchieved': personal_target_achieved
        }
        
    except Exception as e:
        logger.error(f"❌ Target achievement check error: {str(e)}")
        return None

# -------------------------------
# API: Đánh giá kết quả Final Test (Đơn giản hóa như evaluate-placement)
# -------------------------------
@app.route('/api/evaluate-final-test', methods=['POST'])
def evaluate_final_test():
    """
    API endpoint để đánh giá kết quả Final Test
    Sử dụng cấu trúc tương tự như evaluate-placement
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đánh giá Final Test: {data.get('testType', 'IELTS')}")

        # Kiểm tra các trường bắt buộc
        required_fields = ['testType', 'scores', 'totalScore']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        test_type = data['testType']
        scores = data['scores']
        total_score = data['totalScore']
        target_score_range = data.get('targetScoreRange', '6.0-7.0')
        user_goals = data.get('userGoals', {})

        # Tính toán điểm tổng thể
        overall_score = total_score.get('percentage', 0)
        
        # Chuyển đổi sang band/score theo loại test
        if test_type.upper() == 'IELTS':
            if overall_score >= 90:
                estimated_band = 8.5
            elif overall_score >= 80:
                estimated_band = 7.5
            elif overall_score >= 70:
                estimated_band = 6.5
            elif overall_score >= 60:
                estimated_band = 5.5
            elif overall_score >= 50:
                estimated_band = 4.5
            else:
                estimated_band = 3.5
        else:  # TOEIC
            if overall_score >= 90:
                estimated_score = 900
            elif overall_score >= 80:
                estimated_score = 800
            elif overall_score >= 70:
                estimated_score = 700
            elif overall_score >= 60:
                estimated_score = 600
            elif overall_score >= 50:
                estimated_score = 500
            else:
                estimated_score = 400

        # Phân tích từng kỹ năng
        skill_analysis = {}
        skills_in_test = set()
        
        for skill_name, skill_data in scores.items():
            skill_percentage = skill_data.get('percentage', 0)
            skill_analysis[skill_name] = {
                'score': skill_percentage,
                'strengths': [],
                'weaknesses': [],
                'recommendations': []
            }
            skills_in_test.add(skill_name)
            
            # Đánh giá điểm mạnh/yếu cho từng kỹ năng
            if skill_percentage >= 70:
                skill_analysis[skill_name]['strengths'].append(f'Kỹ năng {skill_name} tốt')
            else:
                skill_analysis[skill_name]['weaknesses'].append(f'Cần cải thiện kỹ năng {skill_name}')
                skill_analysis[skill_name]['recommendations'].append(f'Luyện tập {skill_name} thêm')

        # Tạo prompt cho AI phân tích
        skills_text = ", ".join(skills_in_test)
        
        prompt = f"""
Bạn là chuyên gia đánh giá trình độ tiếng Anh.
Dựa trên kết quả Final Test, hãy phân tích và đưa ra đánh giá chi tiết:

**Thông tin test:**
- Loại test: {test_type}
- Kỹ năng được kiểm tra: {skills_text}
- Tổng điểm: {overall_score:.1f}%
- Trình độ ước tính: {estimated_band if test_type.upper() == 'IELTS' else estimated_score}
- Mục tiêu khóa học: {target_score_range}

**Phân tích từng kỹ năng:**
{json.dumps(skill_analysis, indent=2, ensure_ascii=False)}

**Mục tiêu của học sinh:**
{json.dumps(user_goals, indent=2, ensure_ascii=False)}

Hãy trả về JSON với cấu trúc:
{{
  "aiAnalysis": {{
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
    "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"],
    "learningStyle": "visual/auditory/kinesthetic/mixed",
    "confidenceLevel": "low/medium/high",
    "motivationLevel": "low/medium/high",
    "studyPlan": {{
      "duration": 12,
      "hoursPerWeek": 10,
      "focusAreas": ["Kỹ năng 1", "Kỹ năng 2"]
    }},
    "overallAssessment": {{
      "summary": "Đánh giá tổng quan về kết quả",
      "achievementLevel": "Đạt được/Chưa đạt được mục tiêu",
      "improvementAreas": ["Lĩnh vực cần cải thiện 1", "Lĩnh vực cần cải thiện 2"],
      "nextSteps": ["Bước tiếp theo 1", "Bước tiếp theo 2"]
    }},
    "learningPath": {{
      "shortTerm": ["Khóa học ngắn hạn 1", "Khóa học ngắn hạn 2"],
      "longTerm": ["Khóa học dài hạn 1", "Khóa học dài hạn 2"],
      "focusAreas": ["Kỹ năng tập trung 1", "Kỹ năng tập trung 2"]
    }},
    "studyAdvice": {{
      "dailyPractice": "Luyện tập hàng ngày cụ thể",
      "weeklyGoals": "Mục tiêu hàng tuần cụ thể",
      "monthlyMilestones": "Cột mốc hàng tháng cụ thể"
    }}
  }}
}}

**Lưu ý:** Chỉ trả về JSON hợp lệ, không có giải thích thêm.
"""

        try:
            output = llm(prompt, max_tokens=2048, stop=["</s>"])
            raw_text = output["choices"][0]["text"].strip()
            
            logger.info(f"AI raw response: {raw_text}")
            
            # Parse kết quả AI
            ai_analysis = parse_model_output(raw_text)
            logger.info(f"Parsed AI analysis: {ai_analysis}")
        except Exception as ai_error:
            logger.error(f"AI processing error: {ai_error}")
            ai_analysis = None
            logger.info("Using fallback analysis due to AI processing error")
        
        if not ai_analysis:
            logger.warning("AI response parsing failed, using enhanced fallback")
            ai_analysis = generate_fallback_analysis(test_type, overall_score, skill_analysis, skills_in_test, target_score_range)

        # Tạo response với cấu trúc tương tự evaluate-placement
        response_data = {
            'status': 200,
            'testType': test_type,
            'overallScore': overall_score,
            'totalScore': overall_score,
            'estimatedLevel': estimated_band if test_type.upper() == 'IELTS' else estimated_score,
            'skillAnalysis': skill_analysis,
            'aiAnalysis': ai_analysis.get('aiAnalysis', {})
        }
        
        logger.info(f"Final AI Response: {response_data}")
        
        return jsonify(response_data)

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
    Sử dụng cấu trúc tương tự như recommend-courses
    """
    try:
        data = request.json
        logger.info(f"Nhận yêu cầu đề xuất khóa học tiếp theo: {data.get('testType', 'IELTS')}")

        # Kiểm tra các trường bắt buộc
        required_fields = ['testType', 'achievedLevel', 'availableCourses']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Thiếu trường bắt buộc: {field}',
                    'status': 400
                }), 400

        test_type = data['testType']
        achieved_level = data['achievedLevel']
        available_courses = data['availableCourses']
        strengths = data.get('strengths', [])
        weaknesses = data.get('weaknesses', [])
        current_course_id = data.get('currentCourseId')

        # Tạo prompt cho AI đề xuất
        prompt = f"""
Bạn là chuyên gia tư vấn khóa học tiếng Anh.
Dựa trên kết quả Final Test, hãy đề xuất khóa học tiếp theo:

**Thông tin học sinh:**
- Loại test: {test_type}
- Trình độ đạt được: {json.dumps(achieved_level, indent=2, ensure_ascii=False)}
- Điểm mạnh: {strengths}
- Điểm yếu: {weaknesses}

**Danh sách khóa học có sẵn:**
{json.dumps(available_courses, indent=2, ensure_ascii=False)}

**Yêu cầu:**
1. Chọn 3-5 khóa học phù hợp nhất từ danh sách trên
2. Sử dụng courseId chính xác từ danh sách
3. Đưa ra lý do cụ thể cho mỗi khóa học
4. Sắp xếp theo độ ưu tiên (high > medium > low)
5. Tập trung vào việc cải thiện điểm yếu và phát triển điểm mạnh

Hãy trả về JSON với cấu trúc:
{{
  "suggestedCourses": [
    {{
      "courseId": "course_id_here",
      "priority": "high/medium/low",
      "reason": "Lý do đề xuất khóa học này",
      "expectedOutcome": "Kết quả mong đợi sau khi hoàn thành",
      "timeToComplete": "Thời gian hoàn thành dự kiến"
    }}
  ],
  "learningPath": {{
    "shortTerm": ["Khóa học ngắn hạn 1", "Khóa học ngắn hạn 2"],
    "longTerm": ["Khóa học dài hạn 1", "Khóa học dài hạn 2"],
    "focusAreas": ["Kỹ năng cần tập trung 1", "Kỹ năng cần tập trung 2"]
  }},
  "studyAdvice": {{
    "dailyPractice": "Luyện tập hàng ngày cụ thể",
    "weeklyGoals": "Mục tiêu hàng tuần cụ thể",
    "monthlyMilestones": "Cột mốc hàng tháng cụ thể"
  }}
}}

**Lưu ý:** 
- Chỉ trả về JSON hợp lệ, không có giải thích thêm
- Ưu tiên khóa học giúp cải thiện điểm yếu
- Đảm bảo lộ trình học tập logic và thực tế
"""

        try:
            output = llm(prompt, max_tokens=2048, stop=["</s>"])
            raw_text = output["choices"][0]["text"].strip()
            
            logger.info(f"AI raw response: {raw_text}")
            
            # Parse kết quả AI
            ai_recommendations = parse_model_output(raw_text)
            logger.info(f"Parsed recommendations: {ai_recommendations}")
        except Exception as ai_error:
            logger.error(f"AI processing error: {ai_error}")
            ai_recommendations = None
        
        if not ai_recommendations:
            logger.warning("AI response parsing failed, using enhanced fallback")
            ai_recommendations = generate_fallback_recommendations(test_type, achieved_level, available_courses, strengths, weaknesses)

        # Tạo response với cấu trúc tương tự recommend-courses
        response_data = {
            'status': 200,
            'testType': test_type,
            'recommendations': ai_recommendations
        }
        
        logger.info(f"Final recommendations response: {response_data}")
        
        return jsonify(response_data)

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
    
    LƯU Ý: API này đã được tối ưu hóa trong backend để tăng tốc độ xử lý Final Test.
    Backend sẽ tạo learning path đơn giản thay vì gọi AI để giảm thời gian chờ.
    
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

        user_id = data.get('userId')
        test_type = data.get('testType')
        current_level = data.get('currentLevel')
        target_goal = data.get('targetGoal')
        strengths = data.get('strengths', [])
        weaknesses = data.get('weaknesses', [])
        completed_courses = data.get('completedCourses', [])
        
        # Tạo prompt cho AI tạo learning path
        prompt = f"""
Bạn là chuyên gia thiết kế lộ trình học tập tiếng Anh.
Hãy tạo learning path cá nhân hóa cho học sinh:

**Thông tin học sinh:**
- User ID: {user_id}
- Loại test: {test_type}
- Trình độ hiện tại: {json.dumps(current_level, indent=2, ensure_ascii=False)}
- Mục tiêu: {target_goal}
- Điểm mạnh: {strengths}
- Điểm yếu: {weaknesses}
- Khóa học đã hoàn thành: {completed_courses}

**Yêu cầu:**
1. Tạo lộ trình học tập chi tiết từ trình độ hiện tại đến mục tiêu
2. Chia thành các giai đoạn rõ ràng
3. Đưa ra timeline cụ thể
4. Đề xuất phương pháp học tập phù hợp

Hãy trả về JSON với cấu trúc:
{{
  "learningPath": {{
    "userId": "{user_id}",
    "testType": "{test_type}",
    "currentLevel": {json.dumps(current_level, indent=2, ensure_ascii=False)},
    "targetGoal": {target_goal},
    "phases": [
      {{
        "phase": "Foundation",
        "duration": "3 months",
        "focus": ["Grammar basics", "Vocabulary building"],
        "courses": ["Course 1", "Course 2"],
        "milestones": ["Complete basic grammar", "Learn 500 new words"]
      }},
      {{
        "phase": "Intermediate",
        "duration": "4 months", 
        "focus": ["Reading comprehension", "Listening skills"],
        "courses": ["Course 3", "Course 4"],
        "milestones": ["Read 20 articles", "Listen to 50 podcasts"]
      }},
      {{
        "phase": "Advanced",
        "duration": "3 months",
        "focus": ["Writing skills", "Speaking practice"],
        "courses": ["Course 5", "Course 6"],
        "milestones": ["Write 10 essays", "Practice speaking daily"]
      }}
    ],
    "estimatedDuration": "10 months",
    "studyHoursPerWeek": 15,
    "recommendedSchedule": {{
      "monday": ["Grammar", "Vocabulary"],
      "tuesday": ["Reading", "Listening"],
      "wednesday": ["Writing", "Speaking"],
      "thursday": ["Practice tests"],
      "friday": ["Review", "Weak areas"],
      "weekend": ["Rest", "Light practice"]
    }},
    "progressTracking": {{
      "weeklyCheckpoints": ["Complete assigned lessons", "Take mini tests"],
      "monthlyAssessments": ["Full practice tests", "Progress review"],
      "quarterlyEvaluations": ["Official mock tests", "Goal adjustment"]
    }}
  }},
  "personalizedAdvice": {{
    "learningStyle": "visual/auditory/kinesthetic",
    "motivationTips": ["Tip 1", "Tip 2", "Tip 3"],
    "commonPitfalls": ["Pitfall 1", "Pitfall 2"],
    "successStrategies": ["Strategy 1", "Strategy 2"]
  }}
}}

**Lưu ý:** Chỉ trả về JSON hợp lệ, không có giải thích thêm.
"""

        try:
            # Reset context để tránh lỗi sequence position
            llm.reset()
            
            output = llm(prompt, max_tokens=1024, stop=["</s>"])
            raw_text = output["choices"][0]["text"].strip()
            
            logger.info(f"AI raw response: {raw_text}")
            
            # Parse kết quả AI
            learning_path = parse_model_output(raw_text)
            logger.info(f"Parsed learning path: {learning_path}")
        except Exception as ai_error:
            logger.error(f"AI generation failed: {ai_error}")
            learning_path = None
        
        if not learning_path:
            logger.warning("AI response parsing failed, using fallback")
            learning_path = {
                "learningPath": {
                    "userId": user_id,
                    "testType": test_type,
                    "currentLevel": current_level,
                    "targetGoal": target_goal,
                    "phases": [
                        {
                            "phase": "Foundation",
                            "duration": "2 months",
                            "focus": ["Grammar basics", "Vocabulary building"],
                            "courses": ["Basic Grammar Course", "Vocabulary Foundation"],
                            "milestones": ["Complete basic grammar", "Learn 500 new words"]
                        },
                        {
                            "phase": "Intermediate",
                            "duration": "3 months", 
                            "focus": ["Reading comprehension", "Listening skills"],
                            "courses": ["Reading Course", "Listening Practice"],
                            "milestones": ["Read 20 articles", "Listen to 50 podcasts"]
                        },
                        {
                            "phase": "Advanced",
                            "duration": "2 months",
                            "focus": ["Writing skills", "Speaking practice"],
                            "courses": ["Writing Course", "Speaking Practice"],
                            "milestones": ["Write 10 essays", "Practice speaking daily"]
                        }
                    ],
                    "estimatedDuration": "7 months",
                    "studyHoursPerWeek": 15,
                    "recommendedSchedule": {
                        "monday": ["Grammar", "Vocabulary"],
                        "tuesday": ["Reading", "Listening"],
                        "wednesday": ["Writing", "Speaking"],
                        "thursday": ["Practice tests"],
                        "friday": ["Review", "Weak areas"],
                        "weekend": ["Rest", "Light practice"]
                    },
                    "progressTracking": {
                        "weeklyCheckpoints": ["Complete assigned lessons", "Take mini tests"],
                        "monthlyAssessments": ["Full practice tests", "Progress review"],
                        "quarterlyEvaluations": ["Official mock tests", "Goal adjustment"]
                    }
                },
                "personalizedAdvice": {
                    "learningStyle": "mixed",
                    "motivationTips": ["Luyện tập đều đặn", "Đặt mục tiêu rõ ràng", "Theo dõi tiến độ"],
                    "commonPitfalls": ["Bỏ cuộc giữa chừng", "Không luyện tập đều", "Không review bài cũ"],
                    "successStrategies": ["Học đều đặn", "Thực hành nhiều", "Tập trung vào điểm yếu"]
                }
            }

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

# -------------------------------
# Run Flask
# -------------------------------
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
