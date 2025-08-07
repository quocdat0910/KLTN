import React from 'react';
import '../main.css';
import { useNavigate } from 'react-router-dom';

const Component2 = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/register');
  };

  return (
    <div className="component2-container">
      <div className="component2-background" />
      <div className="component2-text">
        80% người học báo cáo các lợi ích nghề nghiệp, <br />
        chẳng hạn như tìm được một công việc mới ...
      </div>
      <button className="component2-button" onClick={handleClick}>Đăng ký ngay</button>
      <img
        className="component2-image"
        src="component2.jpg"
        alt="Promo"
      />
    </div>
  );
};

export default Component2;
