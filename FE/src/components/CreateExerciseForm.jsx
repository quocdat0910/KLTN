import '../Component.css';
import { useState } from 'react';

const CreateExerciseForm = ({ onClose, onCreate }) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('D');

  const handleCorrectSelect = (option) => {
    setCorrectAnswer(option);
  };

  const handleAnswerChange = (option, value) => {
    setAnswers(prev => ({ ...prev, [option]: value }));
  };

  const handleCreate = () => {
    const newExercise = {
      question,
      answers,
      correctAnswer
    };
    onCreate(newExercise); // truyền về AddChapter
    onClose(); // đóng form
  };

  return (
    <div className="form-overlay">
      <div className="create-form">
        <h2 className="form-title">Bài tập</h2>

        <label className="form-label">Câu hỏi</label>
        <input
          type="text"
          className="form-input"
          placeholder="Câu hỏi"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {['A', 'B', 'C', 'D'].map((option) => (
          <div key={option} className="answer-row">
            <span className="answer-label">{option}.</span>
            <input
              type="text"
              className="form-input answer-input"
              placeholder={`Đáp án ${option}`}
              value={answers[option]}
              onChange={(e) => handleAnswerChange(option, e.target.value)}
            />
            <button
              className={`select-answer-btn ${
                correctAnswer === option ? 'selected' : ''
              }`}
              onClick={() => handleCorrectSelect(option)}
            >
              {correctAnswer === option ? '✔' : ''}
            </button>
          </div>
        ))}

        <div className="form-buttons">
          <button className="cancel-button" onClick={onClose}>Hủy</button>
          <button className="create-button" onClick={handleCreate}>Tạo</button>
        </div>
      </div>
    </div>
  );
};

export default CreateExerciseForm;
