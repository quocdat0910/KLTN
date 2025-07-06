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

  const ProductCard = ({ _id, title, thumbnail, price, courseType, shortDescription }) => {
    return (
      <Link 
        to={`/course/${_id}`} 
        className="result-card" 
        style={{ textDecoration: 'none', color: 'inherit', margin: '0 12px 24px 0' }}
      >
        <div className="result-card-inner">
          <img className="result-main-image" src={thumbnail || "Component4a.jpg"} alt="main" />
          <img className="result-avatar" src={'Component4b.jpg'} alt="Instructor Avatar" />
          <div className="result-title">{title}</div>
          <div className="result-subtitle">{courseType}</div>
          <div className="result-price">{price ? `${price.toLocaleString()} VNĐ` : "Miễn phí"}</div>
          {shortDescription && <div className="result-description">{shortDescription}</div>}
        </div>
      </Link>
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
          <div className="result-list">
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
