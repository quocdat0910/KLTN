import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../Component.css'; // Đảm bảo đường dẫn CSS đúng

// Nhận thêm props 'editingExercise'
const CreateExerciseForm = ({ onClose, chapterId, suggestedOrder, onQuizCreated, editingExercise }) => {
    // State của form
    const [title, setTitle] = useState('');     // Tiêu đề bài tập
    const [description, setDescription] = useState(''); // Mô tả bài tập/Nội dung câu hỏi
    const [order, setOrder] = useState('');           // Thứ tự bài tập
    const [answers, setAnswers] = useState({ A: '', B: '', C: '', D: '' }); // Các lựa chọn đáp án
    const [correctAnswerKey, setCorrectAnswerKey] = useState('A'); // Đáp án đúng (A, B, C, D)
    const [loading, setLoading] = useState(false); // Trạng thái loading
    const [isPublished, setIsPublished] = useState(false); // Trạng thái xuất bản

    // useEffect để điền dữ liệu vào form khi ở chế độ chỉnh sửa hoặc reset khi tạo mới
    useEffect(() => {
        if (editingExercise) {
            // Chế độ chỉnh sửa: Điền dữ liệu từ editingExercise
            setTitle(editingExercise.title || '');
            setDescription(editingExercise.description || ''); // 'description' từ quiz model có thể là nội dung câu hỏi
            setOrder(editingExercise.order || '');
            setIsPublished(
                typeof editingExercise.isPublished === 'boolean'
                    ? editingExercise.isPublished
                    : false
            );

            // Xử lý các lựa chọn đáp án từ questions[0].options
            if (editingExercise.questions && editingExercise.questions.length > 0) {
                const mainQuestion = editingExercise.questions[0]; // Lấy câu hỏi đầu tiên (giả định 1 quiz = 1 câu hỏi)
                setDescription(mainQuestion.text || ''); // Cập nhật nội dung câu hỏi vào description state

                const loadedAnswers = {};
                let loadedCorrectKey = 'A';
                // Đảm bảo có đủ 4 option, nếu không có thì gán trống
                const defaultOptions = [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }];
                const optionsToLoad = mainQuestion.options || defaultOptions;

                optionsToLoad.slice(0, 4).forEach((opt, idx) => { // Chỉ lấy tối đa 4 option
                    const key = String.fromCharCode(65 + idx); // Chuyển đổi index thành 'A', 'B', 'C', 'D'
                    loadedAnswers[key] = opt.text || '';
                    if (opt.isCorrect) {
                        loadedCorrectKey = key;
                    }
                });

                // Đảm bảo luôn có đủ 4 key A, B, C, D trong loadedAnswers
                ['A', 'B', 'C', 'D'].forEach(key => {
                    if (!Object.prototype.hasOwnProperty.call(loadedAnswers, key)) {
                        loadedAnswers[key] = '';
                    }
                });

                setAnswers(loadedAnswers);
                setCorrectAnswerKey(loadedCorrectKey);
            } else {
                // Nếu không có câu hỏi trong editingExercise, reset về mặc định
                setAnswers({ A: '', B: '', C: '', D: '' });
                setCorrectAnswerKey('A');
            }
        } else {
            // Chế độ tạo mới: Reset form
            setTitle('');
            setDescription('');
            setOrder(suggestedOrder || ''); // Sử dụng suggestedOrder khi tạo mới
            setAnswers({ A: '', B: '', C: '', D: '' });
            setCorrectAnswerKey('A');
            setIsPublished(false);
        }
    }, [editingExercise, suggestedOrder]); // Dependencies: chạy lại khi editingExercise hoặc suggestedOrder thay đổi

    const handleCorrectSelect = (option) => {
        setCorrectAnswerKey(option);
    };

    const handleAnswerChange = (option, value) => {
        setAnswers(prev => ({ ...prev, [option]: value }));
    };

    // Đổi tên hàm từ handleCreate thành handleSubmit để xử lý cả tạo mới và cập nhật
    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn chặn hành vi submit mặc định của form
        setLoading(true);

        // Frontend Validation
        if (!title.trim()) {
            toast.error("Vui lòng nhập tiêu đề bài tập.");
            setLoading(false);
            return;
        }
        if (title.trim().length < 3 || title.trim().length > 100) {
            toast.error("Tiêu đề bài tập phải từ 3-100 ký tự.");
            setLoading(false);
            return;
        }

        if (!description.trim()) { // Nội dung câu hỏi không được trống
            toast.error("Vui lòng nhập nội dung câu hỏi.");
            setLoading(false);
            return;
        }

        if (isNaN(parseInt(order)) || parseInt(order) <= 0) {
            toast.error("Thứ tự bài tập phải là một số nguyên dương.");
            setLoading(false);
            return;
        }

        // Validate rằng tất cả 4 đáp án A,B,C,D không được trống
        for (const key of ['A', 'B', 'C', 'D']) {
            if (!answers[key].trim()) {
                toast.error(`Đáp án ${key} không được để trống.`);
                setLoading(false);
                return;
            }
        }
        
        // Kiểm tra xem có đúng một đáp án đúng được chọn không
        const correctOptionsCount = Object.keys(answers).filter(key => key === correctAnswerKey && answers[key].trim() !== '').length;
        if (correctOptionsCount !== 1) { // Backend yêu cầu đúng 1 đáp án đúng
            toast.error("Vui lòng chọn đúng một đáp án đúng và đảm bảo nó không trống.");
            setLoading(false);
            return;
        }


        if (!chapterId) {
            toast.error("Lỗi: Không có ID chương. Vui lòng thử lại.");
            setLoading(false);
            return;
        }

        // Chuyển đổi dữ liệu UI sang format của API
        const questionsArray = [
            {
                text: description.trim(), // Nội dung câu hỏi từ description
                options: Object.keys(answers).map(key => ({
                    text: answers[key].trim(),
                    isCorrect: key === correctAnswerKey
                }))
            }
        ];

        const quizData = {
            title: title.trim(),
            description: description.trim(), // Mô tả tổng quan của quiz (có thể trùng với câu hỏi nếu chỉ có 1 câu)
            order: parseInt(order),
            type: 'multiple-choice', // Giả định luôn là trắc nghiệm với form này
            questions: questionsArray,
            isPublished: isPublished,
            // chapter: chapterId, // Không cần gửi chapterId trong body khi PUT/POST vì nó có trong URL
        };

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }

            let res;
            if (editingExercise) {
                // Nếu đang chỉnh sửa, gọi API PUT
                res = await axios.put(
                    // SỬA URL TẠI ĐÂY để khớp với ROUTER BACKEND của bạn: /api/v1/chapters/:chapterId/quizzes/:quizId
                    `http://localhost:4000/api/v1/chapters/${chapterId}/quizzes/${editingExercise._id}`,
                    quizData,
                    {
                        withCredentials: true,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    }
                );
                toast.success(res.data.message || "Cập nhật bài tập thành công!");
            } else {
                // Nếu tạo mới, gọi API POST
                res = await axios.post(
                    `http://localhost:4000/api/v1/chapters/${chapterId}/quizzes`,
                    quizData,
                    {
                        withCredentials: true,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    }
                );
                toast.success(res.data.message || "Tạo bài tập thành công!");
            }

            onQuizCreated(res.data.quiz); // Truyền object quiz đã tạo/cập nhật về component cha
            onClose(); // Đóng modal

        } catch (error) {
            console.error("Lỗi khi xử lý bài tập:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Thao tác bài tập thất bại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-overlay">
            <div className="create-form4">
                <h2 className="form-title">{editingExercise ? 'Chỉnh sửa Bài Tập (Quiz)' : 'Tạo Bài Tập (Quiz)'}</h2>

                <form onSubmit={handleSubmit}>
                    <label className="form-label">Tiêu đề bài tập</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Ví dụ: Bài tập trắc nghiệm chương 1"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={loading}
                        required
                    />

                    <label className="form-label">Câu hỏi</label>
                    <input
                        className="form-input"
                        placeholder="Nhập nội dung câu hỏi"
                        value={description} // Sử dụng description làm nội dung câu hỏi
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        required
                    />

                    {/* Thêm trường xuất bản */}
                    <div className="chapter-form-group">
                        <label htmlFor="isPublishedExercise" className="chapter-toggle-label">
                            <input
                                type="checkbox"
                                id="isPublishedExercise"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                disabled={loading}
                            />
                            <span className="chapter-toggle-slider"></span>
                            Xuất bản bài tập này?
                        </label>
                    </div>

                    {['A', 'B', 'C', 'D'].map((optionKey) => (
                        <div key={optionKey} className="answer-row">
                            <span className="answer-label">{optionKey}.</span>
                            <input
                                type="text"
                                className="form-input answer-input"
                                placeholder={`Đáp án ${optionKey}`}
                                value={answers[optionKey]}
                                onChange={(e) => handleAnswerChange(optionKey, e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className={`select-answer-btn ${
                                    correctAnswerKey === optionKey ? 'selected' : ''
                                }`}
                                onClick={() => handleCorrectSelect(optionKey)}
                                disabled={loading}
                            >
                                {correctAnswerKey === optionKey ? '✔' : ''} {/* SỬA UI: hiện "Chọn" khi chưa chọn */}
                            </button>
                        </div>
                    ))}

                    <div className="form-buttons">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>Hủy</button>
                        <button type="submit" className="create-button" disabled={loading}>
                            {loading ? 'Đang xử lý...' : (editingExercise ? 'Cập nhật' : 'Tạo')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateExerciseForm;
