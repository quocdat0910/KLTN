import React, { useEffect, useState } from 'react';
import '../main.css';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ProductCatComponent = ({ courseType }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`http://localhost:4000/api/v1/courses?courseType=${courseType}`);
        setCourses(res.data.courses || []);
      } catch {
        setError("Không thể tải danh sách khóa học. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [courseType]);

  const ProductCard = ({ _id, title, thumbnail, price, courseType, shortDescription, enrolledCount }) => {
    return (
      <div className="course-card" key={_id}>
        <div className="course-image-wrapper">
          <img 
            className="course-image" 
            src={thumbnail || 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'} 
            alt={title} 
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'; }}
          />
          <img 
            className="course-avatar" 
            src={'Component4b.jpg'} 
            alt="Instructor Avatar" 
          />
        </div>
        <div className="course-title">{title}</div>
        <div className="course-type">{courseType || 'Chưa rõ loại'}</div>
        {price !== undefined && (
          <div className="course-price">
            {price === 0 ? 'Miễn phí' : `${price?.toLocaleString('vi-VN') || 'N/A'} VNĐ`}
          </div>
        )}
        {shortDescription && (
          <div className="course-description">{shortDescription}</div>
        )}
        {enrolledCount !== undefined && (
          <div className="course-enrolled">
            <i className="fa fa-users" style={{marginRight: 4}}></i>{enrolledCount} học viên
          </div>
        )}
        <Link to={`/course/${_id}`} className="course-detail-btn">
          Xem chi tiết <i className="fa fa-arrow-right"></i>
      </Link>
      </div>
    );
  };

  return (
    <div className="productCat-wrapper">
      <div className="productCat-background">
        <img
          className="productCat-topBanner"
          src={courseType === "TOEIC" ? "toeicBanner.png" : "ielts3.png"}
          alt="banner"
        />
        {loading ? (
          <div style={{ textAlign: 'center', margin: 40 }}>Đang tải danh sách khóa học...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', margin: 40, color: 'red' }}>{error}</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 40 }}>
            Không có khóa học nào cho loại "{courseType}".
          </div>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <ProductCard key={course._id} {...course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatComponent;
