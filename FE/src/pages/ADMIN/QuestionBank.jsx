import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaRobot, FaVolumeUp, FaPlay, FaPause, FaTrash, FaEdit, FaEye } from 'react-icons/fa';
import './QuestionBank.css';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [filters, setFilters] = useState({
    testType: '',
    questionType: '',
    difficulty: ''
  });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = React.useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    questionType: 'reading',
    testType: 'IELTS',
    difficulty: 'intermediate',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    passage: '',
    audioUrl: ''
  });

  const [aiRequest, setAiRequest] = useState({
    testType: 'IELTS',
    questionType: 'reading',
    difficulty: 'intermediate',
    count: 5,
    topic: '',
    autoAddToBank: true
  });

  useEffect(() => {
    fetchQuestions(1);
  }, []);

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/question-bank?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { questions, pagination } = response.data.data;
      setQuestions(questions || []);
      setCurrentPage(pagination.page);
      setTotalPages(pagination.pages);
      setTotalQuestions(pagination.total);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Không thể tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const questionData = { ...newQuestion };
      if (questionData.questionType === 'writing') {
        questionData.options = [];
        questionData.correctAnswer = '';
      }

      await axios.post('/api/v1/question-bank', questionData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Thêm câu hỏi thành công!');
      setShowAddModal(false);
      resetNewQuestion();
      fetchQuestions(1);
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Không thể thêm câu hỏi');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;

    try {
      await axios.delete(`/api/v1/question-bank/${questionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Xóa câu hỏi thành công!');
      fetchQuestions(currentPage);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Không thể xóa câu hỏi');
    }
  };

  const handleGenerateAIQuestions = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/api/v1/question-bank/generate-ai', aiRequest, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success(`Tạo thành công ${response.data.data.questions.length} câu hỏi bằng AI!`);
        setShowAIModal(false);
        resetAiRequest();
        fetchQuestions(1);
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      toast.error('Không thể tạo câu hỏi bằng AI');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioToggle = (audioUrl) => {
    if (audioRef.current && audioRef.current.src === audioUrl) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play();
        setIsAudioPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsAudioPlaying(true);
      }
    }
  };

  const resetNewQuestion = () => {
    setNewQuestion({
      question: '',
      questionType: 'reading',
      testType: 'IELTS',
      difficulty: 'intermediate',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      passage: '',
      audioUrl: ''
    });
  };

  const resetAiRequest = () => {
    setAiRequest({
      testType: 'IELTS',
      questionType: 'reading',
      difficulty: 'intermediate',
      count: 5,
      topic: '',
      autoAddToBank: true
    });
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchQuestions(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const getFilteredQuestions = () => {
    return questions.filter(q => {
      if (filters.testType && q.testType !== filters.testType) return false;
      if (filters.questionType && q.questionType !== filters.questionType) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      return true;
    });
  };

  const getQuestionTypeIcon = (type) => {
    const icons = {
      reading: '📖',
      listening: '🎧',
      grammar: '📝',
      vocabulary: '📚',
      writing: '✍️'
    };
    return icons[type] || '❓';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'difficulty-beginner',
      intermediate: 'difficulty-intermediate',
      advanced: 'difficulty-advanced'
    };
    return colors[difficulty] || 'difficulty-default';
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="question-bank-container">
      <div className="question-bank-content">
        {/* Header */}
        <div className="question-bank-header">
          <div className="header-content">
            <div className="header-info">
              <h1 className="header-title">Ngân hàng câu hỏi</h1>
              <p className="header-subtitle">Quản lý và tạo câu hỏi cho placement test</p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => setShowAIModal(true)}
                className="btn btn-ai"
              >
                <FaRobot />
                <span>Tạo bằng AI</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <FaPlus />
                <span>Thêm câu hỏi</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-container">
            <select
              value={filters.testType}
              onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
              className="filter-select"
            >
              <option value="">Tất cả loại test</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEIC">TOEIC</option>
            </select>

            <select
              value={filters.questionType}
              onChange={(e) => setFilters({ ...filters, questionType: e.target.value })}
              className="filter-select"
            >
              <option value="">Tất cả loại câu hỏi</option>
              <option value="reading">Đọc hiểu</option>
              <option value="listening">Nghe hiểu</option>
              <option value="grammar">Ngữ pháp</option>
              <option value="vocabulary">Từ vựng</option>
              <option value="writing">Viết</option>
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="filter-select"
            >
              <option value="">Tất cả độ khó</option>
              <option value="beginner">Sơ cấp</option>
              <option value="intermediate">Trung cấp</option>
              <option value="advanced">Cao cấp</option>
            </select>

            <div className="filter-count">
              Tổng: {filteredQuestions.length} câu hỏi
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="questions-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Đang tải câu hỏi...</p>
            </div>
          ) : (
            <div className="questions-list">
              {filteredQuestions.map((question) => (
                <div key={question._id} className="question-card">
                  <div className="question-header">
                    <div className="question-info">
                      <span className="question-icon">{getQuestionTypeIcon(question.questionType)}</span>
                      <div className="question-details">
                        <h3 className="question-title">{question.question}</h3>
                        <div className="question-meta">
                          <span className={`difficulty-badge ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="meta-item">{question.testType}</span>
                          <span className="meta-item">{question.questionType}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="question-actions">
                      {question.audioUrl && (
                        <button
                          onClick={() => handleAudioToggle(question.audioUrl)}
                          className="action-btn audio-btn"
                          title="Phát audio"
                        >
                          {isAudioPlaying && audioRef.current?.src === question.audioUrl ? <FaPause /> : <FaPlay />}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedQuestion(question)}
                        className="action-btn view-btn"
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question._id)}
                        className="action-btn delete-btn"
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Audio Progress Bar */}
                  {question.audioUrl && (
                    <div className="audio-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${audioProgress}%` }}
                        ></div>
                      </div>
                      <audio
                        ref={audioRef}
                        onTimeUpdate={() => {
                          if (audioRef.current) {
                            setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                          }
                        }}
                        onEnded={() => setIsAudioPlaying(false)}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Options */}
                  {question.options && question.options.length > 0 && (
                    <div className="options-grid">
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                          className={`option-item ${option === question.correctAnswer ? 'correct' : ''}`}
                        >
                          <span className="option-label">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="option-text">{option}</span>
                          {option === question.correctAnswer && (
                            <span className="correct-mark">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="explanation-box">
                      <h4 className="explanation-title">Giải thích:</h4>
                      <p className="explanation-text">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Hiển thị {questions.length} câu hỏi trong tổng số {totalQuestions} câu hỏi
                  </div>
                  
                  <div className="pagination-controls">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    >
                      Trước
                    </button>
                    
                    <div className="page-numbers">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Question Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content question-modal">
              <h2 className="modal-title">Thêm câu hỏi mới</h2>
              
              <form onSubmit={handleAddQuestion} className="question-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Loại test</label>
                    <select
                      value={newQuestion.testType}
                      onChange={(e) => setNewQuestion({ ...newQuestion, testType: e.target.value })}
                      className="form-input"
                    >
                      <option value="IELTS">IELTS</option>
                      <option value="TOEIC">TOEIC</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Loại câu hỏi</label>
                    <select
                      value={newQuestion.questionType}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value })}
                      className="form-input"
                    >
                      <option value="reading">Đọc hiểu</option>
                      <option value="listening">Nghe hiểu</option>
                      <option value="grammar">Ngữ pháp</option>
                      <option value="vocabulary">Từ vựng</option>
                      <option value="writing">Viết</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Độ khó</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                      className="form-input"
                    >
                      <option value="beginner">Sơ cấp</option>
                      <option value="intermediate">Trung cấp</option>
                      <option value="advanced">Cao cấp</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Câu hỏi</label>
                  <textarea
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="form-input"
                    rows={3}
                    required
                  />
                </div>

                {(newQuestion.questionType === 'reading' || newQuestion.questionType === 'listening') && (
                  <div className="form-group">
                    <label className="form-label">
                      {newQuestion.questionType === 'reading' ? 'Đoạn văn' : 'Nội dung nghe'}
                    </label>
                    <textarea
                      value={newQuestion.passage}
                      onChange={(e) => setNewQuestion({ ...newQuestion, passage: e.target.value })}
                      className="form-input"
                      rows={4}
                    />
                  </div>
                )}

                {newQuestion.questionType !== 'writing' && (
                  <div className="form-group">
                    <label className="form-label">Các lựa chọn</label>
                    <div className="options-form">
                      {newQuestion.options.map((option, index) => (
                        <div key={index} className="option-form-item">
                          <span className="option-label-form">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newQuestion.options];
                              newOptions[index] = e.target.value;
                              setNewQuestion({ ...newQuestion, options: newOptions });
                            }}
                            className="option-input"
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={String.fromCharCode(65 + index)}
                            checked={newQuestion.correctAnswer === String.fromCharCode(65 + index)}
                            onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                            className="correct-radio"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Giải thích</label>
                  <textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    className="form-input"
                    rows={3}
                    placeholder="Giải thích tại sao đáp án này đúng..."
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Thêm câu hỏi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI Generation Modal */}
        {showAIModal && (
          <div className="modal-overlay">
            <div className="modal-content ai-modal">              
              <form onSubmit={handleGenerateAIQuestions} className="ai-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Loại test</label>
                    <select
                      value={aiRequest.testType}
                      onChange={(e) => setAiRequest({ ...aiRequest, testType: e.target.value })}
                      className="form-input"
                    >
                      <option value="IELTS">IELTS</option>
                      <option value="TOEIC">TOEIC</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Loại câu hỏi</label>
                    <select
                      value={aiRequest.questionType}
                      onChange={(e) => setAiRequest({ ...aiRequest, questionType: e.target.value })}
                      className="form-input"
                    >
                      <option value="reading">Đọc hiểu</option>
                      <option value="listening">Nghe hiểu</option>
                      <option value="grammar">Ngữ pháp</option>
                      <option value="vocabulary">Từ vựng</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Độ khó</label>
                    <select
                      value={aiRequest.difficulty}
                      onChange={(e) => setAiRequest({ ...aiRequest, difficulty: e.target.value })}
                      className="form-input"
                    >
                      <option value="beginner">Sơ cấp</option>
                      <option value="intermediate">Trung cấp</option>
                      <option value="advanced">Cao cấp</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Số lượng câu hỏi</label>
                    <input
                      type="number"
                      value={aiRequest.count}
                      onChange={(e) => setAiRequest({ ...aiRequest, count: parseInt(e.target.value) })}
                      min="1"
                      max="20"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Chủ đề (tùy chọn)</label>
                    <input
                      type="text"
                      value={aiRequest.topic}
                      onChange={(e) => setAiRequest({ ...aiRequest, topic: e.target.value })}
                      placeholder="Ví dụ: Technology, Environment, Education..."
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="autoAddToBank"
                    checked={aiRequest.autoAddToBank}
                    onChange={(e) => setAiRequest({ ...aiRequest, autoAddToBank: e.target.checked })}
                    className="checkbox-input"
                  />
                  <label htmlFor="autoAddToBank" className="checkbox-label">
                    Tự động thêm vào ngân hàng câu hỏi
                  </label>
                </div>

                <div className="ai-features">
                  <h3 className="features-title">🚀 Tính năng AI</h3>
                  <ul className="features-list">
                    <li>• Tạo câu hỏi đa dạng với độ khó phù hợp</li>
                    <li>• Tự động tạo audio cho câu hỏi listening</li>
                    <li>• Giải thích chi tiết cho từng câu hỏi</li>
                    <li>• Tối ưu hóa cho từng loại test (IELTS/TOEIC)</li>
                  </ul>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowAIModal(false)}
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-ai"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner-small"></div>
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <FaRobot />
                        <span>Tạo câu hỏi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Question Detail Modal */}
        {selectedQuestion && (
          <div className="modal-overlay">
            <div className="modal-content detail-modal">
              <div className="modal-header">
                <h2 className="modal-title">Chi tiết câu hỏi</h2>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              
              <div className="detail-content">
                <div className="detail-section">
                  <h3 className="detail-title">Câu hỏi:</h3>
                  <p className="detail-text">{selectedQuestion.question}</p>
                </div>

                {selectedQuestion.passage && (
                  <div className="detail-section">
                    <h3 className="detail-title">
                      {selectedQuestion.questionType === 'reading' ? 'Đoạn văn:' : 'Nội dung nghe:'}
                    </h3>
                    <div className="passage-box">
                      <p className="passage-text">{selectedQuestion.passage}</p>
                    </div>
                  </div>
                )}

                {selectedQuestion.audioUrl && (
                  <div className="detail-section">
                    <h3 className="detail-title">
                      <FaVolumeUp className="audio-icon" />
                      Audio:
                    </h3>
                    <div className="audio-box">
                      <audio controls className="audio-player">
                        <source src={selectedQuestion.audioUrl} type="audio/mpeg" />
                        Trình duyệt không hỗ trợ audio.
                      </audio>
                    </div>
                  </div>
                )}

                {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                  <div className="detail-section">
                    <h3 className="detail-title">Các lựa chọn:</h3>
                    <div className="detail-options">
                      {selectedQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className={`detail-option ${option === selectedQuestion.correctAnswer ? 'correct' : ''}`}
                        >
                          <span className="option-label">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="option-text">{option}</span>
                          {option === selectedQuestion.correctAnswer && (
                            <span className="correct-mark">✓ Đáp án đúng</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion.explanation && (
                  <div className="detail-section">
                    <h3 className="detail-title">Giải thích:</h3>
                    <div className="explanation-box">
                      <p className="explanation-text">{selectedQuestion.explanation}</p>
                    </div>
                  </div>
                )}

                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">Loại test:</span>
                    <span className="meta-value">{selectedQuestion.testType}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Loại câu hỏi:</span>
                    <span className="meta-value">{selectedQuestion.questionType}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Độ khó:</span>
                    <span className={`difficulty-badge ${getDifficultyColor(selectedQuestion.difficulty)}`}>
                      {selectedQuestion.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;