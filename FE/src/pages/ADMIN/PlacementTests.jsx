import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaRobot, FaEye, FaTrash, FaEdit, FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Placement Test</h1>
              <p className="text-gray-600">Tạo và quản lý các bài kiểm tra trình độ</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaRobot />
                <span>Tạo câu hỏi AI</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>Tạo test mới</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-blue-600">Tổng số test</p>
                  <p className="text-2xl font-bold text-blue-900">{tests.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-green-600">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-green-900">{tests.filter(t => t.isActive).length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-yellow-600">Tổng câu hỏi</p>
                  <p className="text-2xl font-bold text-yellow-900">{getQuestionStats().total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-purple-600">IELTS ({getQuestionStats().ielts})</p>
                  <p className="text-2xl font-bold text-purple-900">{tests.filter(t => t.testType === 'IELTS').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <span className="text-2xl">💼</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-orange-600">TOEIC ({getQuestionStats().toeic})</p>
                  <p className="text-2xl font-bold text-orange-900">{tests.filter(t => t.testType === 'TOEIC').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Create Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo nhanh Placement Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại test</label>
                <select
                  value={quickCreate.testType}
                  onChange={(e) => setQuickCreate({ ...quickCreate, testType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="IELTS">IELTS</option>
                  <option value="TOEIC">TOEIC</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số câu hỏi</label>
                <select
                  value={quickCreate.questionCount}
                  onChange={(e) => setQuickCreate({ ...quickCreate, questionCount: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 câu</option>
                  <option value={10}>10 câu</option>
                  <option value={15}>15 câu</option>
                  <option value={20}>20 câu</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={quickCreate.includeReading}
                    onChange={(e) => setQuickCreate({ ...quickCreate, includeReading: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Reading</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={quickCreate.includeListening}
                    onChange={(e) => setQuickCreate({ ...quickCreate, includeListening: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Listening</span>
                </label>
              </div>
              
              <div>
                <button
                  onClick={handleQuickCreate}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Tạo nhanh
                </button>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="mt-6">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại test</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEIC">TOEIC</option>
            </select>
          </div>
        </div>

        {/* Tests List */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải placement tests...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTests.map((test) => (
                <div key={test._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{test.testType} Placement Test</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Thời gian: {test.timeLimit} phút</span>
                        <span>Điểm đạt: {test.passingScore}%</span>
                        <span>Câu hỏi: {test.totalQuestions}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          test.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {test.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTest(test)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleToggleActive(test._id, test.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          test.isActive 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={test.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      >
                        {test.isActive ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Question Type Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['reading', 'listening', 'grammar', 'vocabulary', 'writing'].map((type) => {
                      const count = getQuestionTypeCount(test, type);
                      if (count === 0) return null;
                      
                      return (
                        <div key={type} className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-2xl mb-1">{getQuestionTypeIcon(type)}</div>
                          <div className="text-sm font-medium text-gray-700 capitalize">{type}</div>
                          <div className="text-lg font-bold text-gray-900">{count}</div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo Placement Test mới</h2>
              
              <form onSubmit={handleCreateTest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại test</label>
                    <select
                      value={newTest.testType}
                      onChange={(e) => setNewTest({ ...newTest, testType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="IELTS">IELTS</option>
                      <option value="TOEIC">TOEIC</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút)</label>
                    <input
                      type="number"
                      value={newTest.timeLimit}
                      onChange={(e) => setNewTest({ ...newTest, timeLimit: parseInt(e.target.value) })}
                      min="15"
                      max="180"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Điểm đạt (%)</label>
                    <input
                      type="number"
                      value={newTest.passingScore}
                      onChange={(e) => setNewTest({ ...newTest, passingScore: parseInt(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Chọn câu hỏi</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {getQuestionsByType(newTest.testType).map((question) => (
                      <div
                        key={question._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          newTest.selectedQuestions.includes(question._id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
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
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">{getQuestionTypeIcon(question.questionType)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(question.difficulty)}`}>
                                {question.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 line-clamp-2">{question.question}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={newTest.selectedQuestions.includes(question._id)}
                            onChange={() => {}}
                            className="ml-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Đã chọn: {newTest.selectedQuestions.length} câu hỏi
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={newTest.selectedQuestions.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Tạo test
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

        {/* Test Detail Modal */}
        {selectedTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTest.testType} Placement Test</h2>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Thông tin cơ bản</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Thời gian:</span> {selectedTest.timeLimit} phút</div>
                      <div><span className="font-medium">Điểm đạt:</span> {selectedTest.passingScore}%</div>
                      <div><span className="font-medium">Tổng câu hỏi:</span> {selectedTest.totalQuestions}</div>
                      <div><span className="font-medium">Trạng thái:</span> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          selectedTest.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTest.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Danh sách câu hỏi</h3>
                  <div className="space-y-4">
                    {selectedTest.questions?.map((questionItem, index) => {
                      const question = questions.find(q => q._id === questionItem.questionId);
                      if (!question) return null;
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getQuestionTypeIcon(question.questionType)}</span>
                              <div>
                                <h4 className="font-medium text-gray-900">Câu {index + 1}</h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span className={`px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                    {question.difficulty}
                                  </span>
                                  <span>{question.questionType}</span>
                                </div>
                              </div>
                            </div>
                            
                            {question.audioUrl && (
                              <button
                                onClick={() => handleAudioToggle(question.audioUrl)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Phát audio"
                              >
                                {isAudioPlaying && audioRef.current?.src === question.audioUrl ? <FaPause /> : <FaPlay />}
                              </button>
                            )}
                          </div>
                          
                          <p className="text-gray-800 mb-3">{question.question}</p>
                          
                          {question.passage && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">{question.passage}</p>
                            </div>
                          )}
                          
                          {question.options && question.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded border text-sm ${
                                    option === question.correctAnswer
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 bg-gray-50'
                                  }`}
                                >
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                  <span>{option}</span>
                                  {option === question.correctAnswer && (
                                    <span className="ml-2 text-green-600 font-semibold">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className="mt-3 bg-blue-50 rounded-lg p-3">
                              <p className="text-sm text-blue-800">{question.explanation}</p>
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
