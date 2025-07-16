import React from 'react';
import '../main.css';
import { useNavigate } from 'react-router-dom';

const Banner = () => {
  const navigate = useNavigate();
  return (
    <div className="banner-container">
      <div className="banner-text">
        <h1 className="banner-title">Mở rộng kiến thức tiếng Anh cùng chuyên gia</h1>
        <p className="banner-subtitle">
          Tham gia các khóa học online chuyên sâu, bài giảng sinh động và chứng chỉ quốc tế.
          Cùng bạn vươn xa trên hành trình học tập.
        </p>
        <button className="banner-button" onClick={() => navigate('/login')}>Bắt đầu học ngay</button>
      </div>
      <div className="banner-image-section">
        <img
          className="banner-image"
          src="banner.jpg"
          alt="Illustration"
        />
      </div>
    </div>
  );
};

export default Banner;
