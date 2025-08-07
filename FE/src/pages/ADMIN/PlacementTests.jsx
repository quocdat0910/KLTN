import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaRobot, FaEye, FaTrash, FaEdit, FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';
import './PlacementTests.css';

const PlacementTests = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = React.useRef(null);

  const [newTest, setNewTest] = useState({
    testType: 'IELTS',
    timeLimit: 60,
    passingScore: 50,
    selectedQuestions: []
  });

  // Quick create state
  const [quickCreate, setQuickCreate] = useState({
    testType: 'IELTS',
    questionCount: 10,
    includeReading: true,
    includeListening: true
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
    fetchTests();
    fetchQuestions();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/placement-tests/admin/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Không thể tải danh sách placement test');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('/api/v1/question-bank?limit=1000', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setQuestions(response.data.data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const testData = {
        testType: newTest.testType,
        timeLimit: newTest.timeLimit,
        passingScore: newTest.passingScore,
        questions: newTest.selectedQuestions.map(qId => ({
          questionId: qId,
          questionType: questions.find(q => q._id === qId)?.questionType || 'reading',
          weight: 1
        })),
        totalQuestions: newTest.selectedQuestions.length
      };

      await axios.post('/api/v1/placement-tests', testData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Tạo placement test thành công!');
      setShowCreateModal(false);
      resetNewTest();
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Không thể tạo placement test');
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
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      toast.error('Không thể tạo câu hỏi bằng AI');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa placement test này?')) return;

    try {
      await axios.delete(`/api/v1/placement-tests/${testId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Xóa placement test thành công!');
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Không thể xóa placement test');
    }
  };

  const handleToggleActive = async (testId, currentStatus) => {
    try {
      await axios.put(`/api/v1/placement-tests/${testId}/toggle`, {
        isActive: !currentStatus
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Cập nhật trạng thái thành công!');
      fetchTests();
    } catch (error) {
      console.error('Error toggling test status:', error);
      toast.error('Không thể cập nhật trạng thái');
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

  const resetNewTest = () => {
    setNewTest({
      testType: 'IELTS',
      timeLimit: 60,
      passingScore: 50,
      selectedQuestions: []
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

  const getQuestionsByType = (testType) => {
    return questions.filter(q => q.testType === testType);
  };

  const getQuestionTypeCount = (test, type) => {
    return test.questions?.filter(q => q.questionType === type).length || 0;
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

  // Quick create functions
  const handleQuickCreate = async () => {
    try {
      const availableQuestions = getQuestionsByType(quickCreate.testType);
      const readingQuestions = availableQuestions.filter(q => 
        quickCreate.includeReading && q.questionType === 'reading'
      );
      const listeningQuestions = availableQuestions.filter(q => 
        quickCreate.includeListening && q.questionType === 'listening'
      );
      
      const selectedQuestions = [
        ...readingQuestions.slice(0, Math.ceil(quickCreate.questionCount / 2)),
        ...listeningQuestions.slice(0, Math.floor(quickCreate.questionCount / 2))
      ].slice(0, quickCreate.questionCount);

      const testData = {
        testType: quickCreate.testType,
        timeLimit: 60,
        passingScore: 50,
        questions: selectedQuestions.map(q => ({
          questionId: q._id,
          questionType: q.questionType,
          weight: 1
        })),
        totalQuestions: selectedQuestions.length
      };

      await axios.post('/api/v1/placement-tests', testData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success(`Tạo thành công ${quickCreate.testType} Placement Test với ${selectedQuestions.length} câu hỏi!`);
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Không thể tạo placement test');
    }
  };

  const getQuestionStats = () => {
    const ieltsQuestions = questions.filter(q => q.testType === 'IELTS');
    const toeicQuestions = questions.filter(q => q.testType === 'TOEIC');
    
    return {
      total: questions.length,
      ielts: ieltsQuestions.length,
      toeic: toeicQuestions.length,
      reading: questions.filter(q => q.questionType === 'reading').length,
      listening: questions.filter(q => q.questionType === 'listening').length
    };
  };

  const filteredTests = filterType === 'all' ? tests : tests.filter(test => test.testType === filterType);

  return (
    <div className="placement-tests-container">
      <div className="placement-tests-content">
        {/* Header */}
        <div className="placement-header">
          <div className="header-content">
            <div className="header-info">
              <h1 className="header-title">Quản lý Placement Test</h1>
              <p className="header-subtitle">Tạo và quản lý các bài kiểm tra trình độ</p>
            </div>
            <div className="header-actions">
              {/* <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaRobot />
                <span>Tạo câu hỏi AI</span>
              </button> */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <FaPlus />
                <span>Tạo test mới</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-container">
            <div className="stat-card stat-blue">
              <div className="stat-icon"><span>📊</span></div>
              <div className="stat-info">
                <p className="stat-label">Tổng số test</p>
                <p className="stat-value">{tests.length}</p>
              </div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-icon"><span>✅</span></div>
              <div className="stat-info">
                <p className="stat-label">Đang hoạt động</p>
                <p className="stat-value">{tests.filter(t => t.isActive).length}</p>
              </div>
            </div>
            <div className="stat-card stat-yellow">
              <div className="stat-icon"><span>📚</span></div>
              <div className="stat-info">
                <p className="stat-label">Tổng câu hỏi</p>
                <p className="stat-value">{getQuestionStats().total}</p>
              </div>
            </div>
            <div className="stat-card stat-purple">
              <div className="stat-icon"><span>🎯</span></div>
              <div className="stat-info">
                <p className="stat-label">IELTS ({getQuestionStats().ielts})</p>
                <p className="stat-value">{tests.filter(t => t.testType === 'IELTS').length}</p>
              </div>
            </div>
            <div className="stat-card stat-orange">
              <div className="stat-icon"><span>💼</span></div>
              <div className="stat-info">
                <p className="stat-label">TOEIC ({getQuestionStats().toeic})</p>
                <p className="stat-value">{tests.filter(t => t.testType === 'TOEIC').length}</p>
              </div>
            </div>
          </div>

          {/* Quick Create Section */}
          <div className="quick-create-container">
            <h3 className="quick-create-title">Tạo nhanh Placement Test</h3>
            <div className="quick-create-grid">
              <div className="form-group">
                <label className="form-label">Loại test</label>
                <select
                  value={quickCreate.testType}
                  onChange={(e) => setQuickCreate({ ...quickCreate, testType: e.target.value })}
                  className="form-input"
                >
                  <option value="IELTS">IELTS</option>
                  <option value="TOEIC">TOEIC</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Số câu hỏi</label>
                <select
                  value={quickCreate.questionCount}
                  onChange={(e) => setQuickCreate({ ...quickCreate, questionCount: parseInt(e.target.value) })}
                  className="form-input"
                >
                  <option value={5}>5 câu</option>
                  <option value={10}>10 câu</option>
                  <option value={15}>15 câu</option>
                  <option value={20}>20 câu</option>
                </select>
              </div>
              <div className="form-group quick-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={quickCreate.includeReading}
                    onChange={(e) => setQuickCreate({ ...quickCreate, includeReading: e.target.checked })}
                    className="checkbox-input"
                  />
                  Reading
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={quickCreate.includeListening}
                    onChange={(e) => setQuickCreate({ ...quickCreate, includeListening: e.target.checked })}
                    className="checkbox-input"
                  />
                  Listening
                </label>
              </div>
              <div>
                <button
                  onClick={handleQuickCreate}
                  className="btn btn-success quick-create-btn"
                >
                  Tạo nhanh
                </button>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="filter-container">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả loại test</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEIC">TOEIC</option>
            </select>
          </div>
        </div>

        {/* Tests List */}
        <div className="tests-list-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Đang tải placement tests...</p>
            </div>
          ) : (
            <div className="tests-list">
              {filteredTests.map((test) => (
                <div key={test._id} className="test-card">
                  <div className="test-header">
                    <div className="test-info">
                      <h3 className="test-title">{test.testType} Placement Test</h3>
                      <div className="test-meta">
                        <span>Thời gian: {test.timeLimit} phút</span>
                        <span>Điểm đạt: {test.passingScore}%</span>
                        <span>Câu hỏi: {test.totalQuestions}</span>
                        <span className={`status-badge ${test.isActive ? 'active' : 'inactive'}`}>
                          {test.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                    <div className="test-actions">
                      <button
                        onClick={() => setSelectedTest(test)}
                        className="action-btn view-btn"
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleToggleActive(test._id, test.isActive)}
                        className={`action-btn ${test.isActive ? 'pause-btn' : 'play-btn'}`}
                        title={test.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      >
                        {test.isActive ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="action-btn delete-btn"
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {/* Question Type Breakdown */}
                  <div className="test-type-breakdown">
                    {['reading', 'listening', 'grammar', 'vocabulary', 'writing'].map((type) => {
                      const count = getQuestionTypeCount(test, type);
                      if (count === 0) return null;
                      return (
                        <div key={type} className="type-breakdown-card">
                          <div className="type-icon">{getQuestionTypeIcon(type)}</div>
                          <div className="type-label">{type}</div>
                          <div className="type-count">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Test Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content create-modal">
              <h2 className="modal-title">Tạo Placement Test mới</h2>
              <form onSubmit={handleCreateTest} className="create-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Loại test</label>
                    <select
                      value={newTest.testType}
                      onChange={(e) => setNewTest({ ...newTest, testType: e.target.value })}
                      className="form-input"
                    >
                      <option value="IELTS">IELTS</option>
                      <option value="TOEIC">TOEIC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thời gian (phút)</label>
                    <input
                      type="number"
                      value={newTest.timeLimit}
                      onChange={(e) => setNewTest({ ...newTest, timeLimit: parseInt(e.target.value) })}
                      min="15"
                      max="180"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Điểm đạt (%)</label>
                    <input
                      type="number"
                      value={newTest.passingScore}
                      onChange={(e) => setNewTest({ ...newTest, passingScore: parseInt(e.target.value) })}
                      min="0"
                      max="100"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Chọn câu hỏi</label>
                  <div className="questions-select-grid">
                    {getQuestionsByType(newTest.testType).map((question) => (
                      <div
                        key={question._id}
                        className={`question-select-card ${newTest.selectedQuestions.includes(question._id) ? 'selected' : ''}`}
                        onClick={() => {
                          const isSelected = newTest.selectedQuestions.includes(question._id);
                          if (isSelected) {
                            setNewTest({
                              ...newTest,
                              selectedQuestions: newTest.selectedQuestions.filter(id => id !== question._id)
                            });
                          } else {
                            setNewTest({
                              ...newTest,
                              selectedQuestions: [...newTest.selectedQuestions, question._id]
                            });
                          }
                        }}
                      >
                        <div className="question-select-header">
                          <span className="question-type-icon">{getQuestionTypeIcon(question.questionType)}</span>
                          <span className={`difficulty-badge ${getDifficultyColor(question.difficulty)}`}>{question.difficulty}</span>
                        </div>
                        <p className="question-select-text">{question.question}</p>
                        <input
                          type="checkbox"
                          checked={newTest.selectedQuestions.includes(question._id)}
                          onChange={() => {}}
                          className="question-checkbox"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="selected-count">Đã chọn: {newTest.selectedQuestions.length} câu hỏi</p>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={newTest.selectedQuestions.length === 0}
                    className="btn btn-primary"
                  >
                    Tạo test
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI Generation Modal */}
        {/* {showAIModal && (
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
        )} */}

        {/* Test Detail Modal */}
        {selectedTest && (
          <div className="modal-overlay">
            <div className="modal-content detail-modal">
              <div className="modal-header">
                <h2 className="modal-title">{selectedTest.testType} Placement Test</h2>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              <div className="detail-content">
                <div className="detail-section">
                  <div className="detail-info-card">
                    <h3 className="detail-info-title">Thông tin cơ bản</h3>
                    <div className="detail-info-list">
                      <div><span className="meta-label">Thời gian:</span> {selectedTest.timeLimit} phút</div>
                      <div><span className="meta-label">Điểm đạt:</span> {selectedTest.passingScore}%</div>
                      <div><span className="meta-label">Tổng câu hỏi:</span> {selectedTest.totalQuestions}</div>
                      <div><span className="meta-label">Trạng thái:</span> <span className={`status-badge ${selectedTest.isActive ? 'active' : 'inactive'}`}>{selectedTest.isActive ? 'Đang hoạt động' : 'Tạm dừng'}</span></div>
                    </div>
                  </div>
                </div>
                <div className="detail-section">
                  <h3 className="detail-title">Danh sách câu hỏi</h3>
                  <div className="detail-questions-list">
                    {selectedTest.questions?.map((questionItem, index) => {
                      const question = questions.find(q => q._id === questionItem.questionId);
                      if (!question) return null;
                      return (
                        <div key={index} className="detail-question-card">
                          <div className="detail-question-header">
                            <span className="question-type-icon">{getQuestionTypeIcon(question.questionType)}</span>
                            <span className={`difficulty-badge ${getDifficultyColor(question.difficulty)}`}>{question.difficulty}</span>
                            <span className="detail-question-index">Câu {index + 1}</span>
                            {question.audioUrl && (
                              <button
                                onClick={() => handleAudioToggle(question.audioUrl)}
                                className="action-btn audio-btn"
                                title="Phát audio"
                              >
                                {isAudioPlaying && audioRef.current?.src === question.audioUrl ? <FaPause /> : <FaPlay />}
                              </button>
                            )}
                          </div>
                          <p className="detail-question-text">{question.question}</p>
                          {question.passage && (
                            <div className="passage-box">
                              <p className="passage-text">{question.passage}</p>
                            </div>
                          )}
                          {question.options && question.options.length > 0 && (
                            <div className="options-grid">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`option-item ${option === question.correctAnswer ? 'correct' : ''}`}
                                >
                                  <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                                  <span className="option-text">{option}</span>
                                  {option === question.correctAnswer && (
                                    <span className="correct-mark">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {question.explanation && (
                            <div className="explanation-box">
                              <p className="explanation-text">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
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

export default PlacementTests;