// Exercise.jsx
import React, { useState, useEffect } from 'react';
import '../main2.css'; // Đảm bảo đường dẫn CSS là chính xác

// Dữ liệu bài tập giả định (thực tế có thể fetch từ API dựa trên exerciseId)
const mockExercises = {
  'intro-quiz-1': {
    title: 'Bài tập giới thiệu cơ bản',
    questions: [
      {
        id: 'q1',
        text: 'Question 1: Choose the most suitable answer for the blank.',
        options: [
          { id: 'a', text: 'Answer A' },
          { id: 'b', text: 'Answer B' },
          { id: 'c', text: 'Answer C' },
          { id: 'd', text: 'Answer D' },
        ],
        correctAnswer: 'b',
        explanation: 'Response B is the best answer because...',
      },
      {
        id: 'q2',
        text: 'Question 2: What is the main idea of the passage?',
        options: [
          { id: 'a', text: 'Option 1' },
          { id: 'b', text: 'Option 2' },
          { id: 'c', text: 'Option 3' },
          { id: 'd', text: 'Option 4' },
        ],
        correctAnswer: 'a',
        explanation: 'The main idea is derived from the first paragraph, which states...',
      },
      // Thêm các câu hỏi khác
    ],
  },
  'grammar-quiz-1': {
    title: 'Luyện tập ngữ pháp: Thì hiện tại đơn',
    questions: [
        {
            id: 'gq1',
            text: 'I ____ to the gym every day.',
            options: [
                { id: 'a', text: 'go' },
                { id: 'b', text: 'goes' },
                { id: 'c', text: 'going' },
                { id: 'd', text: 'gone' },
            ],
            correctAnswer: 'a',
            explanation: 'Sử dụng "go" với chủ ngữ "I" trong thì hiện tại đơn.'
        }
    ]
  }
};

const Exercise = ({ exerciseId, courseId, chapterId, onComplete, isCompleted }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [exerciseData, setExerciseData] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [exerciseCompleted, setExerciseCompleted] = useState(isCompleted || false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (courseId && chapterId) {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/v1/courses/${courseId}/chapters/${chapterId}/exercises/${exerciseId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Exercise API response:', data);
            
            if (data.exercise && data.exercise.questions && data.exercise.questions.length > 0) {
              // Chuyển đổi format từ API sang format component cần
              const convertedExercise = {
                title: data.exercise.title,
                questions: data.exercise.questions.map((q, index) => ({
                  id: `q${index + 1}`,
                  text: q.questionText || q.text || `Question ${index + 1}`,
                  questionAudio: q.questionAudio,
                  questionImage: q.questionImage,
                  options: q.options ? q.options.map((opt, optIndex) => ({
                    id: String(optIndex),
                    text: opt
                  })) : [],
                  correctAnswer: q.correctAnswer !== undefined && q.correctAnswer !== null
                    ? String(q.correctAnswer)
                    : "0",
                  explanation: q.explanation || 'Không có giải thích cho câu hỏi này.'
                }))
              };
              setExerciseData(convertedExercise);
            } else {
              console.warn('API returned empty exercise data, using mock data');
              setExerciseData(mockExercises[exerciseId] || mockExercises['intro-quiz-1']);
            }
          } else {
            console.warn('API failed, using mock data');
            setExerciseData(mockExercises[exerciseId] || mockExercises['intro-quiz-1']);
          }
        } else {
          console.warn('No courseId/chapterId provided, using mock data');
          setExerciseData(mockExercises[exerciseId] || mockExercises['intro-quiz-1']);
        }
      } catch (error) {
        console.error('Error fetching exercise:', error);
        setError('Không thể tải bài tập. Sử dụng dữ liệu mẫu.');
        setExerciseData(mockExercises[exerciseId] || mockExercises['intro-quiz-1']);
      } finally {
        setLoading(false);
      }
      
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setUserAnswers([]);
      setExerciseCompleted(isCompleted || false);
    };

    fetchExerciseData();
  }, [exerciseId, courseId, chapterId, isCompleted]);

  if (loading) {
    return <div className="exercise-container">Đang tải bài tập...</div>;
  }

  if (error) {
    return (
      <div className="exercise-container">
        <div className="error-message">{error}</div>
        {exerciseData && (
          <div className="exercise-fallback">
            <p>Sử dụng dữ liệu mẫu để tiếp tục...</p>
          </div>
        )}
      </div>
    );
  }

  if (!exerciseData || !exerciseData.questions || exerciseData.questions.length === 0) {
    return <div className="exercise-container">Không có dữ liệu bài tập.</div>;
  }

  // Nếu bài tập đã hoàn thành, hiển thị kết quả
  if (exerciseCompleted) {
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const totalQuestions = exerciseData.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    return (
      <div className="exercise-container">
        <h2 className="exercise-title">{exerciseData.title}</h2>
        <div className="question-card">
          <div className="feedback-card correct">
            <div className="feedback-status">
              <span className="feedback-icon">✓</span> Bài tập đã hoàn thành
            </div>
            <p className="feedback-explanation">
              <span className="feedback-label">Điểm số:</span> {score}% ({correctAnswers}/{totalQuestions} câu đúng)
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = exerciseData.questions[currentQuestionIndex];

  // Log dữ liệu câu hỏi hiện tại để kiểm tra đủ trường chưa
  console.log('Current question:', currentQuestion);

  if (!currentQuestion) {
    return <div className="exercise-container">Không tìm thấy câu hỏi hiện tại.</div>;
  }

  const handleOptionChange = (e) => {
    setSelectedAnswer(e.target.value);
    setShowFeedback(false); // Ẩn feedback khi chọn lại
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer) {
      setShowFeedback(true);
      // Lưu câu trả lời của người dùng
      const newUserAnswers = [...userAnswers];
      newUserAnswers[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        userAnswer: selectedAnswer,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer
      };
      setUserAnswers(newUserAnswers);
    } else {
      alert('Vui lòng chọn một đáp án.');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < exerciseData.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Tính toán kết quả cuối cùng
      const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
      const totalQuestions = exerciseData.questions.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassed = score >= 70; // Ngưỡng đạt 70%
      
      setExerciseCompleted(true);
      
      // Gọi callback để cập nhật tiến độ
      if (onComplete) {
        onComplete(exerciseId, score, isPassed);
      }
      
      alert(`Bạn đã hoàn thành bài tập! Điểm số: ${score}% (${correctAnswers}/${totalQuestions} câu đúng)`);
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="exercise-container">
      <h2 className="exercise-title">{exerciseData.title}</h2>
      <div className="question-counter">Question {currentQuestionIndex + 1} of {exerciseData.questions.length}</div>

      <div className="question-card">
        {/* Hiển thị questionText nếu có */}
        {currentQuestion.questionText && (
          <p className="question-text">{currentQuestion.questionText}</p>
        )}
        {/* Hiển thị hình ảnh nếu có */}
        {currentQuestion.questionImage && (
          <div className="question-image-wrapper">
            <img src={currentQuestion.questionImage} alt="Question" className="question-image" style={{maxWidth: '100%', maxHeight: 250, margin: '10px 0'}} />
          </div>
        )}
        {/* Hiển thị audio nếu có */}
        {currentQuestion.questionAudio && (
          <div className="question-audio-wrapper" style={{margin: '10px 0'}}>
            <audio controls src={currentQuestion.questionAudio} style={{width: '100%'}}>
              Trình duyệt của bạn không hỗ trợ audio.
            </audio>
          </div>
        )}
        <p className="question-text">{currentQuestion.text}</p>
        <div className="options-list">
          {currentQuestion.options && currentQuestion.options.map((option, index) => (
            <label
              key={`${currentQuestion.id || currentQuestionIndex}-${option.id || index}`}
              className={`option-item ${showFeedback && option.id === currentQuestion.correctAnswer ? 'correct-answer' : ''} ${showFeedback && option.id === selectedAnswer && !isCorrect ? 'wrong-answer' : ''}`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id || currentQuestionIndex}`}
                value={option.id}
                checked={selectedAnswer === option.id}
                onChange={handleOptionChange}
                disabled={showFeedback} // Tắt input sau khi kiểm tra
              />
              <span className="option-text">{option.text}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="exercise-actions">
        {showFeedback ? (
          <button className="exercise-btn exercise-btn-next" onClick={handleNextQuestion}>
            {currentQuestionIndex < exerciseData.questions.length - 1 ? 'Tiếp tục' : 'Hoàn thành'}
          </button>
        ) : (
          <button className="exercise-btn exercise-btn-submit" onClick={handleSubmitAnswer} disabled={!selectedAnswer}>
            Kiểm tra
          </button>
        )}
      </div>

      {showFeedback && (
        <div className={`feedback-card ${isCorrect ? 'correct' : 'wrong'}`}>
          <div className="feedback-status">
            {isCorrect ? (
              <>
                <span className="feedback-icon">✔</span> That's correct
              </>
            ) : (
              <>
                <span className="feedback-icon">✖</span> Incorrect
              </>
            )}
          </div>
          <p className="feedback-explanation">
            <span className="feedback-label">Because:</span> {currentQuestion.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default Exercise;