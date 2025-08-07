import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaRobot, FaVolumeUp, FaPlay, FaPause, FaTrash, FaEdit, FaEye } from 'react-icons/fa';

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
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ngân hàng câu hỏi</h1>
              <p className="text-gray-600">Quản lý và tạo câu hỏi cho placement test</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaRobot />
                <span>Tạo bằng AI</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>Thêm câu hỏi</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.testType}
              onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả loại test</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEIC">TOEIC</option>
            </select>

            <select
              value={filters.questionType}
              onChange={(e) => setFilters({ ...filters, questionType: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả độ khó</option>
              <option value="beginner">Sơ cấp</option>
              <option value="intermediate">Trung cấp</option>
              <option value="advanced">Cao cấp</option>
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              Tổng: {filteredQuestions.length} câu hỏi
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải câu hỏi...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredQuestions.map((question) => (
                <div key={question._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getQuestionTypeIcon(question.questionType)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{question.question}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span>{question.testType}</span>
                          <span>{question.questionType}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {question.audioUrl && (
                        <button
                          onClick={() => handleAudioToggle(question.audioUrl)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Phát audio"
                        >
                          {isAudioPlaying && audioRef.current?.src === question.audioUrl ? <FaPause /> : <FaPlay />}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedQuestion(question)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Audio Progress Bar */}
                  {question.audioUrl && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            option === question.correctAnswer
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <span className="font-medium text-gray-700 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-gray-800">{option}</span>
                          {option === question.correctAnswer && (
                            <span className="ml-2 text-green-600 font-semibold">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Giải thích:</h4>
                      <p className="text-blue-800 text-sm">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Hiển thị {questions.length} câu hỏi trong tổng số {totalQuestions} câu hỏi
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg border ${
                        currentPage === 1
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Trước
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg border ${
                              currentPage === page
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg border ${
                        currentPage === totalPages
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thêm câu hỏi mới</h2>
              
              <form onSubmit={handleAddQuestion} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại test</label>
                    <select
                      value={newQuestion.testType}
                      onChange={(e) => setNewQuestion({ ...newQuestion, testType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="IELTS">IELTS</option>
                      <option value="TOEIC">TOEIC</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                    <select
                      value={newQuestion.questionType}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="reading">Đọc hiểu</option>
                      <option value="listening">Nghe hiểu</option>
                      <option value="grammar">Ngữ pháp</option>
                      <option value="vocabulary">Từ vựng</option>
                      <option value="writing">Viết</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">Sơ cấp</option>
                      <option value="intermediate">Trung cấp</option>
                      <option value="advanced">Cao cấp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Câu hỏi</label>
                  <textarea
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                {(newQuestion.questionType === 'reading' || newQuestion.questionType === 'listening') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newQuestion.questionType === 'reading' ? 'Đoạn văn' : 'Nội dung nghe'}
                    </label>
                    <textarea
                      value={newQuestion.passage}
                      onChange={(e) => setNewQuestion({ ...newQuestion, passage: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                )}

                {newQuestion.questionType !== 'writing' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Các lựa chọn</label>
                      <div className="space-y-2">
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="font-medium text-gray-700 w-8">{String.fromCharCode(65 + index)}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newQuestion.options];
                                newOptions[index] = e.target.value;
                                setNewQuestion({ ...newQuestion, options: newOptions });
                              }}
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                            />
                            <input
                              type="radio"
                              name="correctAnswer"
                              value={String.fromCharCode(65 + index)}
                              checked={newQuestion.correctAnswer === String.fromCharCode(65 + index)}
                              onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                              className="ml-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giải thích</label>
                  <textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Giải thích tại sao đáp án này đúng..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FaRobot className="mr-3 text-purple-600" />
                Tạo câu hỏi bằng AI
              </h2>
              
              <form onSubmit={handleGenerateAIQuestions} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại test</label>
                    <select
                      value={aiRequest.testType}
                      onChange={(e) => setAiRequest({ ...aiRequest, testType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="IELTS">IELTS</option>
                      <option value="TOEIC">TOEIC</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                    <select
                      value={aiRequest.questionType}
                      onChange={(e) => setAiRequest({ ...aiRequest, questionType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="reading">Đọc hiểu</option>
                      <option value="listening">Nghe hiểu</option>
                      <option value="grammar">Ngữ pháp</option>
                      <option value="vocabulary">Từ vựng</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                    <select
                      value={aiRequest.difficulty}
                      onChange={(e) => setAiRequest({ ...aiRequest, difficulty: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">Sơ cấp</option>
                      <option value="intermediate">Trung cấp</option>
                      <option value="advanced">Cao cấp</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng câu hỏi</label>
                    <input
                      type="number"
                      value={aiRequest.count}
                      onChange={(e) => setAiRequest({ ...aiRequest, count: parseInt(e.target.value) })}
                      min="1"
                      max="20"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề (tùy chọn)</label>
                    <input
                      type="text"
                      value={aiRequest.topic}
                      onChange={(e) => setAiRequest({ ...aiRequest, topic: e.target.value })}
                      placeholder="Ví dụ: Technology, Environment, Education..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoAddToBank"
                    checked={aiRequest.autoAddToBank}
                    onChange={(e) => setAiRequest({ ...aiRequest, autoAddToBank: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="autoAddToBank" className="text-sm text-gray-700">
                    Tự động thêm vào ngân hàng câu hỏi
                  </label>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">🚀 Tính năng AI</h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Tạo câu hỏi đa dạng với độ khó phù hợp</li>
                    <li>• Tự động tạo audio cho câu hỏi listening</li>
                    <li>• Giải thích chi tiết cho từng câu hỏi</li>
                    <li>• Tối ưu hóa cho từng loại test (IELTS/TOEIC)</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAIModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết câu hỏi</h2>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Câu hỏi:</h3>
                  <p className="text-gray-800">{selectedQuestion.question}</p>
                </div>

                {selectedQuestion.passage && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {selectedQuestion.questionType === 'reading' ? 'Đoạn văn:' : 'Nội dung nghe:'}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-800 whitespace-pre-line">{selectedQuestion.passage}</p>
                    </div>
                  </div>
                )}

                {selectedQuestion.audioUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FaVolumeUp className="mr-2 text-blue-600" />
                      Audio:
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <audio controls className="w-full">
                        <source src={selectedQuestion.audioUrl} type="audio/mpeg" />
                        Trình duyệt không hỗ trợ audio.
                      </audio>
                    </div>
                  </div>
                )}

                {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Các lựa chọn:</h3>
                    <div className="space-y-2">
                      {selectedQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            option === selectedQuestion.correctAnswer
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <span className="font-medium text-gray-700 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-gray-800">{option}</span>
                          {option === selectedQuestion.correctAnswer && (
                            <span className="ml-2 text-green-600 font-semibold">✓ Đáp án đúng</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion.explanation && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Giải thích:</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-blue-800">{selectedQuestion.explanation}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Loại test:</span>
                    <span className="ml-2 text-gray-800">{selectedQuestion.testType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Loại câu hỏi:</span>
                    <span className="ml-2 text-gray-800">{selectedQuestion.questionType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Độ khó:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getDifficultyColor(selectedQuestion.difficulty)}`}>
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
