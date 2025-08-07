import React, { useState, useEffect, useCallback, useRef } from 'react';
import './AI.css';
import axios from 'axios';
import { toast } from "react-toastify";
import { FaPlay, FaPause, FaVolumeUp, FaBookOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
        {/* Question Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
              {questionData.questionType?.toUpperCase() || 'QUESTION'}
            </span>
            <span className="text-gray-600 text-base font-medium">
              Câu {currentQuestionIndex + 1} / {placementTest.questions.length}
            </span>
          </div>
          <div className="text-lg text-gray-500 font-semibold">
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Audio Player for Listening */}
        {questionData.questionType === 'listening' && questionData.audioUrl && (
          <div className="mb-8 bg-blue-50 rounded-lg p-5 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaVolumeUp className="text-blue-600 text-xl" />
                <span className="font-semibold text-gray-800 text-lg">Audio Playback</span>
              </div>
              <button
                onClick={handleAudioToggle}
                className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-md"
              >
                {isAudioPlaying ? <FaPause className="text-sm" /> : <FaPlay className="text-sm" />}
                <span>{isAudioPlaying ? 'Tạm dừng' : 'Phát Audio'}</span>
              </button>
            </div>
            
            {/* Audio Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-linear"
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
          <div className="mb-8 bg-purple-50 rounded-lg p-5 border border-purple-100">
            <h3 className="font-semibold text-purple-800 text-lg mb-3 flex items-center">
              <FaBookOpen className="mr-2 text-purple-600" />
              Đoạn văn
            </h3>
            <p className="text-gray-800 leading-relaxed text-base">{questionData.passage}</p>
          </div>
        )}

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-5 leading-relaxed">
            {questionData.question}
          </h3>

          {/* Options */}
          <div className="space-y-4">
            {questionData.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md ${
                  answers[questionData._id] === String.fromCharCode(65 + index)
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${questionData._id}`}
                  value={String.fromCharCode(65 + index)}
                  checked={answers[questionData._id] === String.fromCharCode(65 + index)}
                  onChange={(e) => handleAnswerChange(questionData._id, e.target.value)}
                  className="mr-4 h-5 w-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-gray-700 w-6 flex-shrink-0">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-gray-800 flex-grow">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 1. Màn hình chọn loại test
  if (showTypeSelection) {
    return (
      <div className="ai-container">
        <div className="ai-header">
          <div className="ai-icon">🎯</div>
          <h1 className="ai-title">Kiểm tra trình độ tiếng Anh</h1>
          <p className="ai-desc">
            Khám phá trình độ tiếng Anh của bạn với AI đánh giá thông minh và nhận gợi ý khóa học phù hợp
          </p>
        </div>
        <div className="ai-card-list">
          <div className="ai-card ai-card-ielts" onClick={() => handleTestTypeSelection('IELTS')}>
            <div className="ai-card-icon">📚</div>
            <h3 className="ai-card-title">IELTS</h3>
            <p className="ai-card-desc">Kiểm tra trình độ tiếng Anh học thuật với 4 kỹ năng: Nghe, Nói, Đọc, Viết</p>
            <ul className="ai-card-features">
              <li>Thời gian: 60 phút</li>
              <li>Điểm số: 0-9 band</li>
              <li>AI đánh giá chi tiết</li>
            </ul>
          </div>
          <div className="ai-card ai-card-toeic" onClick={() => handleTestTypeSelection('TOEIC')}>
            <div className="ai-card-icon">💼</div>
            <h3 className="ai-card-title">TOEIC</h3>
            <p className="ai-card-desc">Kiểm tra trình độ tiếng Anh giao tiếp trong môi trường công việc</p>
            <ul className="ai-card-features">
              <li>Thời gian: 60 phút</li>
              <li>Điểm số: 0-990</li>
              <li>AI đánh giá chi tiết</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-container">
      <div className="ai-test-header">
        <div>
          <h2 className="ai-test-title">Placement Test - {testType}</h2>
          <p className="ai-test-progress">
            Câu {currentQuestionIndex + 1} / {placementTest.questions.length} • Đã trả lời: {getAnsweredCount()} / {placementTest.questions.length}
          </p>
        </div>
        <div className="ai-test-timer">
          <span>{formatTime(timeRemaining)}</span>
          <div className="ai-test-timer-label">Thời gian còn lại</div>
        </div>
      </div>
      <div className="ai-progress-bar">
        <div className="ai-progress-bar-inner" style={{ width: `${getProgress()}%` }}></div>
      </div>
      <div className="ai-question-card">
        <div className="ai-question-header">
          <span className="ai-question-type">{getCurrentQuestion()?.questionId?.questionType?.toUpperCase() || 'QUESTION'}</span>
          <span className="ai-question-index">Câu {currentQuestionIndex + 1} / {placementTest.questions.length}</span>
          <span className="ai-question-timer">{formatTime(timeRemaining)}</span>
        </div>
        {/* Audio, Reading, Question, Options... */}
        {getCurrentQuestion()?.questionId?.questionType === 'listening' && getCurrentQuestion()?.questionId?.audioUrl && (
          <div className="ai-audio-box">
            <div className="ai-audio-header">
              <FaVolumeUp className="ai-audio-icon" />
              <button className="ai-btn ai-btn-audio" onClick={handleAudioToggle}>
                {isAudioPlaying ? <FaPause /> : <FaPlay />} {isAudioPlaying ? 'Tạm dừng' : 'Phát Audio'}
              </button>
            </div>
            <div className="ai-audio-progress">
              <div className="ai-audio-progress-inner" style={{ width: `${audioProgress}%` }}></div>
            </div>
            <audio ref={audioRef} src={getCurrentQuestion()?.questionId?.audioUrl} onEnded={() => setIsAudioPlaying(false)} className="ai-audio-element" />
          </div>
        )}
        {getCurrentQuestion()?.questionId?.questionType === 'reading' && getCurrentQuestion()?.questionId?.passage && (
          <div className="ai-reading-box">
            <FaBookOpen className="ai-reading-icon" />
            <div className="ai-reading-content">{getCurrentQuestion()?.questionId?.passage}</div>
          </div>
        )}
        <div className="ai-question-text">{getCurrentQuestion()?.questionId?.question}</div>
        <div className="ai-options-list">
          {getCurrentQuestion()?.questionId?.options?.map((option, index) => (
            <label
              key={index}
              className={`ai-option ${answers[getCurrentQuestion()?.questionId?._id] === String.fromCharCode(65 + index) ? 'ai-option-selected' : ''}`}
            >
              <input
                type="radio"
                name={`question-${getCurrentQuestion()?.questionId?._id}`}
                value={String.fromCharCode(65 + index)}
                checked={answers[getCurrentQuestion()?.questionId?._id] === String.fromCharCode(65 + index)}
                onChange={(e) => handleAnswerChange(getCurrentQuestion()?.questionId?._id, e.target.value)}
              />
              <span className="ai-option-label">{String.fromCharCode(65 + index)}.</span>
              <span className="ai-option-text">{option}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="ai-nav-btns">
        <button className="ai-btn ai-btn-prev" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>← Câu trước</button>
        <button className="ai-btn ai-btn-submit" onClick={() => setShowConfirmSubmit(true)}>Nộp bài</button>
        <button className="ai-btn ai-btn-next" onClick={handleNextQuestion} disabled={currentQuestionIndex === placementTest.questions.length - 1}>Câu tiếp →</button>
      </div>
      {showConfirmSubmit && (
        <div className="ai-modal-overlay">
          <div className="ai-modal">
            <h2>Xác nhận nộp bài</h2>
            <p>Bạn có chắc chắn muốn nộp bài? Bạn sẽ không thể thay đổi câu trả lời sau khi nộp.</p>
            <div className="ai-modal-actions">
              <button className="ai-btn ai-btn-cancel" onClick={() => setShowConfirmSubmit(false)}>Hủy</button>
              <button className="ai-btn ai-btn-submit" onClick={handleSubmitTest} disabled={isSubmitting}>{isSubmitting ? 'Đang nộp...' : 'Nộp bài'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTest;