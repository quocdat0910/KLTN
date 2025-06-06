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

const Exercise = ({ exerciseId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [exerciseData, setExerciseData] = useState(null);

  useEffect(() => {
    // Trong thực tế, bạn sẽ fetch dữ liệu từ API dựa trên exerciseId
    // fetch(`/api/exercises/${exerciseId}`).then(res => res.json()).then(data => setExerciseData(data));
    setExerciseData(mockExercises[exerciseId]); // Sử dụng dữ liệu giả định
    setCurrentQuestionIndex(0); // Reset khi exerciseId thay đổi
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [exerciseId]);

  if (!exerciseData) {
    return <div className="exercise-container">Đang tải bài tập...</div>;
  }

  const currentQuestion = exerciseData.questions[currentQuestionIndex];

  const handleOptionChange = (e) => {
    setSelectedAnswer(e.target.value);
    setShowFeedback(false); // Ẩn feedback khi chọn lại
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer) {
      setShowFeedback(true);
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
      alert('Bạn đã hoàn thành tất cả các câu hỏi!');
      // Có thể thêm logic hiển thị kết quả cuối cùng hoặc quay lại bài học
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="exercise-container">
      <h2 className="exercise-title">{exerciseData.title}</h2>
      <div className="question-counter">Question {currentQuestionIndex + 1}</div>

      <div className="question-card">
        <p className="question-text">{currentQuestion.text}</p>
        <div className="options-list">
          {currentQuestion.options.map((option) => (
            <label
              key={option.id}
              className={`option-item ${showFeedback && option.id === currentQuestion.correctAnswer ? 'correct-answer' : ''} ${showFeedback && option.id === selectedAnswer && !isCorrect ? 'wrong-answer' : ''}`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
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
            Tiếp tục
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