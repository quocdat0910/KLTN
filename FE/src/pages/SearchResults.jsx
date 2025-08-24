import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
import '../main.css';

const SearchResults = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const keyword = queryParams.get('q') || '';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: '1', limit: '1000' });
        const res = await axios.get(`http://localhost:4000/api/v1/courses?${qs.toString()}`);
        let filtered = res.data.courses || [];
        if (keyword) {
          const lower = keyword.toLowerCase();
          filtered = filtered.filter(course =>
            course.title?.toLowerCase().includes(lower) ||
            course.shortDescription?.toLowerCase().includes(lower)
          );
        }
        setCourses(filtered);
      } catch {
        setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [keyword]);

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, courses.length));
  };

  const visibleCourses = courses.slice(0, displayCount);
  const showShowMoreBtn = courses.length > displayCount;

  const containerStyle = {
    width: '100%',
    position: 'static',
    display: 'block',
    background: 'none',
    boxShadow: 'none',
    padding: 0
  };
  const gridStyle = {
    maxWidth: '1550px',
    margin: '30 auto',
    width: '100%',
    background: 'rgba(229, 245, 255, 0.8)',
    borderRadius: 0,
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
  };

  return (
    <div className="component4-container" style={containerStyle}>
      <h2 className="result-title-main" style={{ textAlign: 'center', marginTop: 16 }}>
        Kết quả tìm kiếm cho "{keyword}"
      </h2>
      {loading && (
        <div className="text-center text-lg text-gray-700" style={{ textAlign: 'center', margin: 40 }}>Đang tải khóa học...</div>
      )}
      {error && (
        <div className="text-center text-lg text-red-600 p-4 bg-red-100 border border-red-400 rounded-lg" style={{ textAlign: 'center', margin: 40 }}>
          {error}
        </div>
      )}
      {!loading && !error && courses.length === 0 && (
        <div className="text-center text-lg text-gray-700" style={{ textAlign: 'center', margin: 40 }}>Không tìm thấy khóa học nào.</div>
      )}
      {!loading && !error && courses.length > 0 && (
        <div className="course-grid" style={gridStyle}>
          {visibleCourses.map((course) => (
            <div className="course-card" key={course._id}>
              <div className="course-image-wrapper">
                <img
                  className="course-image"
                  src={course.thumbnail || 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'}
                  alt={course.title}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'; }}
                />
                <img
                  className="course-avatar"
                  src={'Component4b.jpg'}
                  alt="Instructor Avatar"
                />
              </div>
              <div className="course-title">{course.title}</div>
              <div className="course-type">{course.courseType || 'Chưa rõ loại'}</div>
              {course.price !== undefined && (
                <div className="course-price">
                  {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN') || 'N/A'} VNĐ`}
                </div>
              )}
              {course.shortDescription && (
                <div className="course-description">{course.shortDescription}</div>
              )}
              <Link to={`/course/${course._id}`} className="course-detail-btn">
                Xem chi tiết <i className="fa fa-arrow-right"></i>
              </Link>
            </div>
          ))}
                {showShowMoreBtn && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button className="course-show-more-btn" onClick={handleShowMore}>
            Hiển thị thêm 10
          </button>
        </div>
      )}
        </div>
        
      )}
    </div>
  );
};

export default SearchResults;