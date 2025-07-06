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

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('http://localhost:4000/api/v1/courses?limit=100');
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

  const SearchResultCard = ({ _id, title, thumbnail, price, courseType, shortDescription }) => (
    <Link 
      to={`/course/${_id}`} 
      className="result-card" 
      style={{ textDecoration: 'none', color: 'inherit', margin: '0 12px 24px 0' }}
    >
      <div className="result-card-inner">
        <img className="result-main-image" src={thumbnail || 'Component4a.jpg'} alt="main" />
        <img className="result-avatar" src={'Component4b.jpg'} alt="Instructor Avatar" />
        <div className="result-title">{title}</div>
        <div className="result-subtitle">{courseType}</div>
        <div className="result-price">{price ? `${price.toLocaleString()} VNĐ` : 'Miễn phí'}</div>
        {shortDescription && <div className="result-description">{shortDescription}</div>}
      </div>
    </Link>
  );

  return (
    <div className="result-wrapper">
      <div className="result-content">
        <h2 className="result-title-main">
          Kết quả tìm kiếm cho "{keyword}"
        </h2>
        {loading ? (
          <div className="result-loading">Đang tải danh sách khóa học...</div>
        ) : error ? (
          <div className="result-error">{error}</div>
        ) : courses.length === 0 ? (
          <div className="result-empty">Không tìm thấy khóa học nào phù hợp với từ khóa "{keyword}".</div>
        ) : (
          <div className="result-list3">
            {courses.map((course) => (
              <SearchResultCard key={course._id} {...course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults; 