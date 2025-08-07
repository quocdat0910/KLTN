import React, { useState } from 'react';
import './AI.css';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaLightbulb, FaBookOpen, FaStar, FaArrowRight } from 'react-icons/fa';

const mockResult = {
  overallScore: 82,
  estimatedLevel: 'upper-intermediate',
  detailedAnalysis: {
    reading: {
      score: 85,
      strengths: ['Đọc hiểu nhanh', 'Nắm ý chính tốt'],
      weaknesses: ['Chưa đa dạng từ vựng'],
      recommendations: ['Luyện đọc báo tiếng Anh', 'Học thêm từ vựng học thuật']
    },
    listening: {
      score: 78,
      strengths: ['Nghe hiểu hội thoại tốt'],
      weaknesses: ['Khó nghe accent Anh-Anh'],
      recommendations: ['Nghe podcast tiếng Anh', 'Luyện nghe accent đa dạng']
    }
  },
  performanceMetrics: {
    averageTimePerQuestion: 18,
    accuracyRate: 88,
    consistencyScore: 80
  }
};
const mockRecommendedCourses = [
  {
    _id: '1',
    title: 'IELTS Reading Mastery',
    description: 'Khóa học chuyên sâu giúp bạn nâng cao kỹ năng đọc hiểu IELTS.',
    difficulty: 'intermediate',
    averageRating: 4.7
  },
  {
    _id: '2',
    title: 'TOEIC Listening Pro',
    description: 'Luyện nghe TOEIC với các bài tập thực tế và mẹo làm bài.',
    difficulty: 'beginner',
    averageRating: 4.5
  }
];
const mockAiInsights = {
  userProfile: {
    aiAnalytics: {
      strengths: ['Tư duy logic', 'Tự học tốt'],
      weaknesses: ['Thiếu kiên nhẫn khi học dài'],
      learningStyle: 'Visual',
      optimalPace: '45 phút/ngày'
    },
    learningPreferences: {
      preferredContentType: 'Video',
      preferredDifficulty: 'Trung bình'
    }
  }
};

const PlacementTestResult = () => {
  const navigate = useNavigate();
  // const location = useLocation();
  // const [result, setResult] = useState(location.state?.result || null);
  // const [recommendedCourses, setRecommendedCourses] = useState([]);
  // const [loading, setLoading] = useState(!result);
  // const [activeTab, setActiveTab] = useState('overview');
  // const [aiInsights, setAiInsights] = useState(null);

  // useEffect(() => { ... }, []);
  // const fetchRecommendedCourses = async () => { ... };
  // const fetchAIInsights = async () => { ... };
  // const fetchLatestResult = useCallback(async () => { ... }, []);

  // if (loading) { ... }
  // if (!result) { ... }

  const result = mockResult;
  const recommendedCourses = mockRecommendedCourses;
  const aiInsights = mockAiInsights;

  const getLevelDescription = (level) => {
    const levels = {
      'beginner': { name: 'Sơ cấp' },
      'elementary': { name: 'Cơ bản' },
      'intermediate': { name: 'Trung cấp' },
      'upper-intermediate': { name: 'Trung cao cấp' },
      'advanced': { name: 'Cao cấp' },
      'proficient': { name: 'Thành thạo' }
    };
    return levels[level] || levels['intermediate'];
  };

  return (
    <div className="ai-container">
      <div className="ai-header">
        <div className="ai-icon ai-icon-green">
          <FaChartLine />
        </div>
        <h1 className="ai-title">Kết quả Placement Test</h1>
        <p className="ai-desc">
          Khám phá trình độ tiếng Anh của bạn và nhận gợi ý khóa học phù hợp
        </p>
      </div>
      <div className="ai-result-main">
        <div className="ai-result-left">
          {/* Tổng quan */}
          <div className="ai-result-card ai-result-overview">
            <div className="ai-result-score-circle">
              <span className="ai-result-score">{result.overallScore}%</span>
            </div>
            <div className="ai-result-level">
              {getLevelDescription(result.estimatedLevel).name}
            </div>
            <div className="ai-result-level-desc">
              Trình độ ước tính: {result.estimatedLevel}
            </div>
          </div>
          {/* Phân tích kỹ năng */}
          <div className="ai-result-card">
            <h2 className="ai-result-section-title">
              <FaBookOpen className="ai-result-section-icon" />
              Phân tích từng kỹ năng
            </h2>
            <div className="ai-result-skill-list">
              {result.detailedAnalysis && Object.entries(result.detailedAnalysis).map(([skill, data]) => (
                <div key={skill} className="ai-result-skill-card">
                  <h3 className="ai-result-skill-title">
                    {skill === 'reading' ? 'Đọc hiểu' :
                      skill === 'listening' ? 'Nghe hiểu' :
                        skill === 'grammar' ? 'Ngữ pháp' :
                          skill === 'vocabulary' ? 'Từ vựng' :
                            skill === 'writing' ? 'Viết' : skill}
                  </h3>
                  <div className="ai-result-skill-scorebar">
                    <div className="ai-result-skill-scorebar-inner" style={{ width: `${data.score || 0}%` }}></div>
                    <span className="ai-result-skill-score">{data.score || 0}%</span>
                  </div>
                  {data.strengths && data.strengths.length > 0 && (
                    <div className="ai-result-skill-strengths">
                      <div className="ai-result-skill-label ai-green">Điểm mạnh:</div>
                      <ul>
                        {data.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.weaknesses && data.weaknesses.length > 0 && (
                    <div className="ai-result-skill-weaknesses">
                      <div className="ai-result-skill-label ai-red">Cần cải thiện:</div>
                      <ul>
                        {data.weaknesses.map((weakness, idx) => (
                          <li key={idx}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.recommendations && data.recommendations.length > 0 && (
                    <div className="ai-result-skill-recommend">
                      <div className="ai-result-skill-label ai-blue">Gợi ý:</div>
                      <ul>
                        {data.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* AI Insights */}
          {mockAiInsights && (
            <div className="ai-result-card">
              <h2 className="ai-result-section-title">
                <FaLightbulb className="ai-result-section-icon ai-yellow" />
                AI Insights
              </h2>
              <div className="ai-result-ai-insights">
                {/* ...tương tự như trên, dùng className ai-... */}
              </div>
            </div>
          )}
        </div>
        <div className="ai-result-right">
          {/* Khóa học đề xuất */}
          <div className="ai-result-card">
            <h2 className="ai-result-section-title">
              <FaStar className="ai-result-section-icon ai-yellow" />
              Khóa học đề xuất
            </h2>
            {recommendedCourses.length > 0 ? (
              <div className="ai-result-course-list">
                {recommendedCourses.map((course) => (
                  <div key={course._id} className="ai-result-course-card">
                    <h3 className="ai-result-course-title">{course.title}</h3>
                    <p className="ai-result-course-desc">{course.description}</p>
                    <div className="ai-result-course-meta">
                      <span className={`ai-result-course-difficulty ai-${course.difficulty}`}>
                        {course.difficulty}
                      </span>
                      <span className="ai-result-course-rating">
                        <FaStar /> {course.averageRating || 0}
                      </span>
                    </div>
                    <button className="ai-btn ai-btn-next" onClick={() => {}}>
                      Đăng ký <FaArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ai-result-course-empty">
                <p>Chưa có khóa học phù hợp</p>
                <button className="ai-btn ai-btn-next" onClick={() => navigate('/courses')}>
                  Xem tất cả khóa học
                </button>
              </div>
            )}
          </div>
          {/* Chỉ số hiệu suất */}
          {result.performanceMetrics && (
            <div className="ai-result-card">
              <h2 className="ai-result-section-title">Chỉ số hiệu suất</h2>
              <div className="ai-result-metrics">
                <div>
                  <span>Thời gian trung bình/câu:</span>
                  <span>{result.performanceMetrics.averageTimePerQuestion}s</span>
                </div>
                <div>
                  <span>Tỷ lệ chính xác:</span>
                  <span>{result.performanceMetrics.accuracyRate}%</span>
                </div>
                <div>
                  <span>Điểm nhất quán:</span>
                  <span>{result.performanceMetrics.consistencyScore}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="ai-result-actions">
        <button className="ai-btn ai-btn-next" onClick={() => navigate('/placement-test')}>
          Làm lại placement test
        </button>
        <button className="ai-btn ai-btn-submit" onClick={() => navigate('/courses')}>
          Xem tất cả khóa học
        </button>
      </div>
    </div>
  );
};

export default PlacementTestResult;