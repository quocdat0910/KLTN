import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from "react-toastify";
import { FaChartLine, FaLightbulb, FaBookOpen, FaStar, FaArrowRight } from 'react-icons/fa';

const PlacementTestResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result || null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(!result);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState(null);

  // Define fetchLatestResult before useEffect
  const fetchLatestResult = useCallback(async () => {
    try {
      // Try to get latest placement test result
      const response = await axios.get('/api/v1/placement-tests/result/IELTS', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setResult(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching placement test result:', error);
      toast.error('Không thể tải kết quả kiểm tra trình độ');
      navigate('/placement-test');
    }
  }, [navigate]);

  useEffect(() => {
    if (!result) {
      // If no result in state, fetch from API
      fetchLatestResult();
    } else {
      fetchRecommendedCourses();
      fetchAIInsights();
    }
  }, [fetchLatestResult, result]);

  const fetchRecommendedCourses = async () => {
    try {
      const response = await axios.get('/api/v1/recommendations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRecommendedCourses(response.data.data.recommendedCourses || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const response = await axios.get('/api/v1/users/ai-insights', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAiInsights(response.data.data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreBorderColor = (percentage) => {
    if (percentage >= 80) return 'border-green-500';
    if (percentage >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getLevelDescription = (level) => {
    const levels = {
      'beginner': { name: 'Sơ cấp', color: 'text-red-600', bg: 'bg-red-100' },
      'elementary': { name: 'Cơ bản', color: 'text-orange-600', bg: 'bg-orange-100' },
      'intermediate': { name: 'Trung cấp', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      'upper-intermediate': { name: 'Trung cao cấp', color: 'text-blue-600', bg: 'bg-blue-100' },
      'advanced': { name: 'Cao cấp', color: 'text-green-600', bg: 'bg-green-100' },
      'proficient': { name: 'Thành thạo', color: 'text-purple-600', bg: 'bg-purple-100' }
    };
    return levels[level] || levels['intermediate'];
  };

  const handleEnrollCourse = async (courseId) => {
    try {
      await axios.post('/api/v1/enrollments', {
        courseId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update recommendation status
      await axios.put('/api/v1/recommendations/status', {
        courseId,
        status: 'enrolled'
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Đăng ký khóa học thành công!');
      navigate('/my-courses');
    } catch (error) {
      console.error('Error enrolling course:', error);
      toast.error('Không thể đăng ký khóa học');
    }
  };

  const renderSkillChart = (skillName, score) => {
    const percentage = score || 0;
    return (
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">{skillName}</span>
          <span className={`font-bold ${getScoreColor(percentage)}`}>
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getScoreBgColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy kết quả</h2>
          <p className="text-gray-600 mb-6">Bạn chưa hoàn thành placement test</p>
          <button
            onClick={() => navigate('/placement-test')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Làm placement test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6 shadow-lg">
            <FaChartLine className="text-3xl text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Kết quả Placement Test
          </h1>
          <p className="text-xl text-gray-600">
            Khám phá trình độ tiếng Anh của bạn và nhận gợi ý khóa học phù hợp
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Điểm tổng quan</h2>
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBorderColor(result.overallScore)} ${getScoreBgColor(result.overallScore)}`}>
                  <span className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}%
                  </span>
                </div>
              </div>

              {/* Level Assessment */}
              <div className="text-center">
                <div className={`inline-block px-6 py-3 rounded-full ${getLevelDescription(result.estimatedLevel).bg} ${getLevelDescription(result.estimatedLevel).color} font-semibold`}>
                  {getLevelDescription(result.estimatedLevel).name}
                </div>
                <p className="text-gray-600 mt-2">
                  Trình độ ước tính: {result.estimatedLevel}
                </p>
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FaBookOpen className="mr-3 text-blue-600" />
                Phân tích từng kỹ năng
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {result.detailedAnalysis && Object.entries(result.detailedAnalysis).map(([skill, data]) => (
                  <div key={skill} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 capitalize">
                      {skill === 'reading' ? 'Đọc hiểu' :
                       skill === 'listening' ? 'Nghe hiểu' :
                       skill === 'grammar' ? 'Ngữ pháp' :
                       skill === 'vocabulary' ? 'Từ vựng' :
                       skill === 'writing' ? 'Viết' : skill}
                    </h3>
                    
                    {renderSkillChart('Điểm số', data.score)}
                    
                    {data.strengths && data.strengths.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-green-700 mb-2">Điểm mạnh:</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          {data.strengths.map((strength, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {data.weaknesses && data.weaknesses.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-red-700 mb-2">Cần cải thiện:</h4>
                        <ul className="text-sm text-red-800 space-y-1">
                          {data.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {data.recommendations && data.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Gợi ý:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {data.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            {aiInsights && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FaLightbulb className="mr-3 text-yellow-600" />
                  AI Insights
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {aiInsights.userProfile?.aiAnalytics && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                      <h3 className="font-semibold text-purple-900 mb-4">Hồ sơ học tập</h3>
                      
                      {aiInsights.userProfile.aiAnalytics.learningStyle && (
                        <div className="mb-4">
                          <p className="text-sm text-purple-700 font-medium">Phong cách học:</p>
                          <p className="text-purple-900">{aiInsights.userProfile.aiAnalytics.learningStyle}</p>
                        </div>
                      )}
                      
                      {aiInsights.userProfile.aiAnalytics.optimalPace && (
                        <div className="mb-4">
                          <p className="text-sm text-purple-700 font-medium">Tốc độ học tối ưu:</p>
                          <p className="text-purple-900">{aiInsights.userProfile.aiAnalytics.optimalPace}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {aiInsights.userProfile?.learningPreferences && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                      <h3 className="font-semibold text-green-900 mb-4">Sở thích học tập</h3>
                      
                      {aiInsights.userProfile.learningPreferences.preferredContentType && (
                        <div className="mb-4">
                          <p className="text-sm text-green-700 font-medium">Loại nội dung ưa thích:</p>
                          <p className="text-green-900">{aiInsights.userProfile.learningPreferences.preferredContentType}</p>
                        </div>
                      )}
                      
                      {aiInsights.userProfile.learningPreferences.preferredDifficulty && (
                        <div className="mb-4">
                          <p className="text-sm text-green-700 font-medium">Độ khó ưa thích:</p>
                          <p className="text-green-900">{aiInsights.userProfile.learningPreferences.preferredDifficulty}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recommendations */}
          <div className="space-y-6">
            {/* Recommended Courses */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FaStar className="mr-3 text-yellow-500" />
                Khóa học đề xuất
              </h2>
              
              {recommendedCourses.length > 0 ? (
                <div className="space-y-4">
                  {recommendedCourses.map((course) => (
                    <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Độ khó:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {course.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaStar className="text-yellow-400 text-sm" />
                          <span className="text-sm text-gray-600">{course.averageRating || 0}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleEnrollCourse(course._id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>Đăng ký</span>
                        <FaArrowRight className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Chưa có khóa học phù hợp</p>
                  <button
                    onClick={() => navigate('/courses')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xem tất cả khóa học
                  </button>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            {result.performanceMetrics && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Chỉ số hiệu suất</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Thời gian trung bình/câu:</span>
                    <span className="font-semibold">{result.performanceMetrics.averageTimePerQuestion}s</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tỷ lệ chính xác:</span>
                    <span className="font-semibold">{result.performanceMetrics.accuracyRate}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Điểm nhất quán:</span>
                    <span className="font-semibold">{result.performanceMetrics.consistencyScore}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/placement-test')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Làm lại placement test
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Xem tất cả khóa học
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementTestResult;
