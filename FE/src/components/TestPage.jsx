import React, { useState, useEffect } from 'react';
import '../Component.css';

const TestPage = () => {
  const totalQuestions = 20; // Tổng số câu hỏi
  const totalTimeMinutes = 20; // Tổng thời gian làm bài (phút)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(totalTimeMinutes * 60); // Thời gian còn lại tính bằng giây
  const [progress, setProgress] = useState(0); // Tiến độ làm bài (%)

  // Dữ liệu câu hỏi giả định (sẽ được thay thế bằng dữ liệu thực tế)
  const questions = [
    {
      id: 1,
      text: "What is the capital of France?",
      options: [
        { id: 'a', text: "A. Berlin" },
        { id: 'b', text: "B. Madrid" },
        { id: 'c', text: "C. Paris" },
        { id: 'd', text: "D. Rome" },
      ],
      correctAnswer: 'c',
    },
    {
      id: 2,
      text: "Which planet is known as the Red Planet?",
      options: [
        { id: 'a', text: "A. Earth" },
        { id: 'b', text: "B. Mars" },
        { id: 'c', text: "C. Jupiter" },
        { id: 'd', text: "D. Venus" },
      ],
      correctAnswer: 'b',
    },
    // ... Thêm 18 câu hỏi nữa ở đây
    {
      id: 3,
      text: "What is the largest ocean on Earth?",
      options: [
        { id: 'a', text: "A. Atlantic Ocean" },
        { id: 'b', text: "B. Indian Ocean" },
        { id: 'c', text: "C. Arctic Ocean" },
        { id: 'd', text: "D. Pacific Ocean" },
      ],
      correctAnswer: 'd',
    },
    {
      id: 4,
      text: "Who painted the Mona Lisa?",
      options: [
        { id: 'a', text: "A. Vincent van Gogh" },
        { id: 'b', text: "B. Leonardo da Vinci" },
        { id: 'c', text: "C. Pablo Picasso" },
        { id: 'd', text: "D. Claude Monet" },
      ],
      correctAnswer: 'b',
    },
    {
        id: 5,
        text: "What is the chemical symbol for water?",
        options: [
          { id: 'a', text: "A. O2" },
          { id: 'b', text: "B. H2O" },
          { id: 'c', text: "C. CO2" },
          { id: 'd', text: "D. NaCl" },
        ],
        correctAnswer: 'b',
      },
      {
        id: 6,
        text: "Which country is known as the Land of the Rising Sun?",
        options: [
          { id: 'a', text: "A. China" },
          { id: 'b', text: "B. South Korea" },
          { id: 'c', text: "C. Japan" },
          { id: 'd', text: "D. Thailand" },
        ],
        correctAnswer: 'c',
      },
      {
        id: 7,
        text: "What is the highest mountain in the world?",
        options: [
          { id: 'a', text: "A. Mount Everest" },
          { id: 'b', text: "B. K2" },
          { id: 'c', "text": "C. Mount Kilimanjaro" },
          { id: 'd', text: "D. Mount Fuji" },
        ],
        correctAnswer: 'a',
      },
      {
        id: 8,
        text: "Who wrote 'Romeo and Juliet'?",
        options: [
          { id: 'a', text: "A. Charles Dickens" },
          { id: 'b', text: "B. William Shakespeare" },
          { id: 'c', text: "C. Jane Austen" },
          { id: 'd', text: "D. Leo Tolstoy" },
        ],
        correctAnswer: 'b',
      },
      {
        id: 9,
        text: "What is the currency of Japan?",
        options: [
          { id: 'a', text: "A. Yuan" },
          { id: 'b', text: "B. Won" },
          { id: 'c', text: "C. Yen" },
          { id: 'd', text: "D. Dollar" },
        ],
        correctAnswer: 'c',
      },
      {
        id: 10,
        text: "Which animal is known as the 'King of the Jungle'?",
        options: [
          { id: 'a', text: "A. Tiger" },
          { id: 'b', text: "B. Lion" },
          { id: 'c', text: "C. Elephant" },
          { id: 'd', text: "D. Bear" },
        ],
        correctAnswer: 'b',
      },
      {
        id: 11,
        text: "What is the capital of Australia?",
        options: [
          { id: 'a', text: "A. Sydney" },
          { id: 'b', text: "B. Melbourne" },
          { id: 'c', text: "C. Canberra" },
          { id: 'd', text: "D. Perth" },
        ],
        correctAnswer: 'c',
      },
      {
        id: 12,
        text: "What is the largest desert in the world?",
        options: [
          { id: 'a', text: "A. Sahara Desert" },
          { id: 'b', text: "B. Arabian Desert" },
          { id: 'c', text: "C. Gobi Desert" },
          { id: 'd', text: "D. Antarctic Polar Desert" },
        ],
        correctAnswer: 'd',
      },
      {
        id: 13,
        text: "Which gas do plants absorb from the atmosphere?",
        options: [
          { id: 'a', text: "A. Oxygen" },
          { id: 'b', text: "B. Nitrogen" },
          { id: 'c', text: "C. Carbon Dioxide" },
          { id: 'd', text: "D. Hydrogen" },
        ],
        correctAnswer: 'c',
      },
      {
        id: 14,
        text: "How many continents are there in the world?",
        options: [
          { id: 'a', text: "A. 5" },
          { id: 'b', text: "B. 6" },
          { id: 'c', text: "C. 7" },
          { id: 'd', text: "D. 8" },
        ],
        correctAnswer: 'c',
      },
      {
        id: 15,
        text: "What is the fastest land animal?",
        options: [
          { id: 'a', text: "A. Lion" },
          { id: 'b', text: "B. Cheetah" },
          { id: 'c', text: "C. Gazelle" },
          { id: 'd', text: "D. Horse" },
        ],
        correctAnswer: 'b',
      },
      {
        id: 16,
        text: "Which country is famous for the Eiffel Tower?",
        options: [
          { id: 'a', text: "A. Italy" },
          { id: 'b', text: "B. Spain" },
          { id: 'c', text: "C. Germany" },
          { id: 'd', text: "D. France" },
        ],
        correctAnswer: 'd',
      },
      {
        id: 17,
        text: "What is the main ingredient of guacamole?",
        options: [
          { id: 'a', text: "A. Tomato" },
          { id: 'b', text: "B. Avocado" },
          { id: 'c', text: "C. Onion" },
          { id: 'd', text: "D. Lime" },
        ],
        correctAnswer: 'b',
      },
      {
        id: 18,
        text: "Which famous scientist developed the theory of relativity?",
        options: [
          { id: 'a', text: "A. Isaac Newton" },
          { id: 'b', text: "B. Albert Einstein" },
          { id: 'c', text: "C. Stephen Hawking" },
          { id: 'd', text: "D. Marie Curie" },
        ],
        correctAnswer: 'b',
      },
      {
        id: 19,
        text: "What is the largest planet in our solar system?",
        options: [
          { id: 'a', text: "A. Earth" },
          { id: 'b', text: "B. Mars" },
          { id: 'c', text: "C. Jupiter" },
          { id: 'd', text: "D. Saturn" },
        ],
        correctAnswer: 'c',
      },
      {
        id: 20,
        text: "What is the process by which plants make their own food?",
        options: [
          { id: 'a', text: "A. Respiration" },
          { id: 'b', text: "B. Photosynthesis" },
          { id: 'c', text: "C. Transpiration" },
          { id: 'd', text: "D. Fermentation" },
        ],
        correctAnswer: 'b',
      },
  ];

  // Effect để đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) return; // Dừng khi hết giờ

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId); // Cleanup timer
  }, [timeLeft]);

  // Effect để cập nhật tiến độ
  useEffect(() => {
    const newProgress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    setProgress(newProgress);
  }, [currentQuestionIndex, totalQuestions]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedAnswer(null); // Reset lựa chọn khi chuyển câu
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      setSelectedAnswer(null); // Reset lựa chọn khi chuyển câu
    }
  };

  const handleSubmitTest = () => {
    // Logic để nộp bài và tính điểm
    alert('Bài kiểm tra đã được nộp!');
    // Redirect hoặc hiển thị kết quả
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="test-page-container">
      <div className="test-page-title">General English Level Test | {totalTimeMinutes} phút</div>

      <div className="test-card">
        <div className="test-header">
          <span className="test-timer">{formatTime(timeLeft)}</span>
          <span className="test-question-count">Câu hỏi {currentQuestionIndex + 1}/{totalQuestions}</span>
          <div className="test-progress-bar-track">
            <div className="test-progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="test-question-item">
          <div className="test-question-number">{currentQuestion.id}</div>
          <div className="test-question-text">
            {currentQuestion.text}
          </div>
        </div>

        <div className="test-options">
          {currentQuestion.options.map(option => (
            <label key={option.id} className="test-option-item">
              <input
                type="radio"
                name="answer"
                value={option.id}
                checked={selectedAnswer === option.id}
                onChange={handleAnswerChange}
              />
              {option.text}
            </label>
          ))}
        </div>

        <div className="test-navigation-buttons">
          <button
            className="test-nav-button prev"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Câu trước
          </button>
          <button
            className="test-nav-button next"
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Câu sau
          </button>
        </div>

        <button className="test-submit-button" onClick={handleSubmitTest}>
          Nộp bài
        </button>
      </div>
    </div>
  );
};

export default TestPage;