import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from "react-toastify";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const PlacementTest = () => {
  const [testType, setTestType] = useState('');
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  const [placementTest, setPlacementTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  // Submit test handler
  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime - startTime) / 1000);
      const formattedAnswers = placementTest?.questions.map(q => ({
        questionId: q.questionId._id,
        userAnswer: answers[q.questionId._id] || '',
        timeSpent: Math.floor(timeSpent / placementTest.questions.length)
      })) || [];

      const response = await axios.post('/api/v1/placement-tests/submit', {
        placementTestId: placementTest._id,
        answers: formattedAnswers,
        timeSpent,
        startedAt: startTime
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Fetch AI insights after submission
      try {
        const insightsResponse = await axios.get('/api/v1/users/ai-insights', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAiInsights(insightsResponse.data.data);
        setShowAiInsights(true);
      } catch (error) {
        console.error('Error fetching AI insights:', error);
      }

      toast.success('Hoàn thành placement test thành công!');
      navigate('/placement-result', { state: { result: response.data.data } });
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, placementTest, answers, startTime, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && placementTest) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && placementTest) {
      handleSubmitTest();
    }
  }, [timeRemaining, placementTest, handleSubmitTest]);

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsAudioPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', () => setIsAudioPlaying(false));
    };
  }, []);

  const handleTestTypeSelection = async (selectedType) => {
    setTestType(selectedType);
    try {
      const response = await axios.get(`/api/v1/placement-tests/${selectedType}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.data.hasCompleted) {
        toast.success('Bạn đã hoàn thành placement test!');
        navigate('/placement-result', { state: { result: response.data.data.result } });
        return;
      }

      setPlacementTest(response.data.data.test);
      setTimeRemaining(response.data.data.test.timeLimit * 60);
      setStartTime(new Date());
      setShowTypeSelection(false);
    } catch (error) {
      console.error('Error fetching placement test:', error);
      toast.error('Không thể tải placement test');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < placementTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionJump = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleAudioToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      audio.play();
      setIsAudioPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((currentQuestionIndex + 1) / placementTest.questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getCurrentQuestion = () => {
    if (!placementTest || !placementTest.questions[currentQuestionIndex]) return null;
    return placementTest.questions[currentQuestionIndex];
  };

  const renderQuestion = () => {
    const question = getCurrentQuestion();
    if (!question) return null;

    const questionData = question.questionId || question;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Question Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {questionData.questionType?.toUpperCase() || 'QUESTION'}
            </span>
            <span className="text-gray-500 text-sm">
              Câu {currentQuestionIndex + 1} / {placementTest.questions.length}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Audio Player for Listening */}
        {questionData.questionType === 'listening' && questionData.audioUrl && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FaVolumeUp className="text-blue-600" />
                <span className="font-medium text-gray-700">Audio</span>
              </div>
              <button
                onClick={handleAudioToggle}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isAudioPlaying ? <FaPause /> : <FaPlay />}
                <span>{isAudioPlaying ? 'Tạm dừng' : 'Phát'}</span>
              </button>
            </div>
            
            {/* Audio Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${audioProgress}%` }}
              ></div>
            </div>
            
            <audio
              ref={audioRef}
              src={questionData.audioUrl}
              onEnded={() => setIsAudioPlaying(false)}
              className="hidden"
            />
          </div>
        )}

        {/* Passage for Reading */}
        {questionData.questionType === 'reading' && questionData.passage && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Đoạn văn:</h3>
            <p className="text-gray-800 leading-relaxed">{questionData.passage}</p>
          </div>
        )}

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {questionData.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {questionData.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  answers[questionData._id] === String.fromCharCode(65 + index)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${questionData._id}`}
                  value={String.fromCharCode(65 + index)}
                  checked={answers[questionData._id] === String.fromCharCode(65 + index)}
                  onChange={(e) => handleAnswerChange(questionData._id, e.target.value)}
                  className="mr-3"
                />
                <span className="font-medium text-gray-700 mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (showTypeSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-8 shadow-lg">
              <span className="text-4xl text-white">🎯</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Kiểm tra trình độ tiếng Anh
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Khám phá trình độ tiếng Anh của bạn với AI đánh giá thông minh và nhận gợi ý khóa học phù hợp
            </p>
          </div>

          {/* Enhanced Test Type Selection */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-12">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">
              Chọn loại bài kiểm tra
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* IELTS Card */}
              <div 
                onClick={() => handleTestTypeSelection('IELTS')}
                className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-transparent hover:border-blue-300 transition-all duration-300 hover:shadow-xl"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl text-white">📚</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">IELTS</h3>
                  <p className="text-gray-600 mb-6">
                    Kiểm tra trình độ tiếng Anh học thuật với 4 kỹ năng: Nghe, Nói, Đọc, Viết
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Thời gian: 60 phút
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Điểm số: 0-9 band
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      AI đánh giá chi tiết
                    </div>
                  </div>
                </div>
              </div>

              {/* TOEIC Card */}
              <div 
                onClick={() => handleTestTypeSelection('TOEIC')}
                className="group cursor-pointer bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border-2 border-transparent hover:border-green-300 transition-all duration-300 hover:shadow-xl"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl text-white">💼</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">TOEIC</h3>
                  <p className="text-gray-600 mb-6">
                    Kiểm tra trình độ tiếng Anh giao tiếp trong môi trường công việc
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      Thời gian: 60 phút
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      Điểm số: 0-990
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      AI đánh giá chi tiết
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Features Highlight */}
            <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
                🚀 Tính năng AI nâng cao
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-4">
                    <span className="text-white">🎵</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Audio tự động</h4>
                  <p className="text-sm text-gray-600">Tạo audio cho câu hỏi listening</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-600 rounded-full mb-4">
                    <span className="text-white">🧠</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">AI đánh giá</h4>
                  <p className="text-sm text-gray-600">Phân tích chi tiết từng kỹ năng</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-4">
                    <span className="text-white">📊</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Gợi ý khóa học</h4>
                  <p className="text-sm text-gray-600">Đề xuất khóa học phù hợp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Placement Test - {testType}
              </h1>
              <p className="text-gray-600">
                Câu {currentQuestionIndex + 1} / {placementTest.questions.length} • 
                Đã trả lời: {getAnsweredCount()} / {placementTest.questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-500">Thời gian còn lại</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Tiến độ</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {placementTest.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionJump(index)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[placementTest.questions[index].questionId?._id || placementTest.questions[index]._id]
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        {renderQuestion()}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-6">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>←</span>
            <span>Câu trước</span>
          </button>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Nộp bài
            </button>
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === placementTest.questions.length - 1}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Câu tiếp</span>
            <span>→</span>
          </button>
        </div>

        {/* AI Insights Modal */}
        {showAiInsights && aiInsights && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 AI Insights</h2>
              
              <div className="space-y-6">
                {/* Placement Test Results */}
                {aiInsights.placementTest && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Kết quả Placement Test</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700">Trình độ ước tính:</p>
                        <p className="font-semibold text-blue-900">
                          {aiInsights.placementTest.estimatedLevel?.ielts?.overall || 
                           aiInsights.placementTest.estimatedLevel?.toeic?.overall || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">Loại test:</p>
                        <p className="font-semibold text-blue-900">{aiInsights.placementTest.testType}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Profile */}
                {aiInsights.userProfile && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">Hồ sơ học tập</h3>
                    <div className="space-y-3">
                      {aiInsights.userProfile.aiAnalytics?.strengths?.length > 0 && (
                        <div>
                          <p className="text-sm text-green-700 font-medium">Điểm mạnh:</p>
                          <ul className="list-disc list-inside text-sm text-green-800">
                            {aiInsights.userProfile.aiAnalytics.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiInsights.userProfile.aiAnalytics?.weaknesses?.length > 0 && (
                        <div>
                          <p className="text-sm text-green-700 font-medium">Cần cải thiện:</p>
                          <ul className="list-disc list-inside text-sm text-green-800">
                            {aiInsights.userProfile.aiAnalytics.weaknesses.map((weakness, index) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAiInsights(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Submit Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Xác nhận nộp bài</h2>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn nộp bài? Bạn sẽ không thể thay đổi câu trả lời sau khi nộp.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacementTest;
