import React from 'react';
import '../main.css';
import { useNavigate } from 'react-router-dom';

const Component8 = () => {
  const navigate = useNavigate();
  return (
    <div className="component8-container animate-fade-in">
      <div className="component8-background" />
      <img
        className="component8-image"
        src="logo.png"
        alt="Mục tiêu DA"
      />
      <div className="component8-title">
        Đạt được những mục tiêu với DA
      </div>
      <button className="component8-button" onClick={() => navigate('/login')}>
        <span className="button-primary-text">Học ngay</span>
      </button>
      <div className="component8-subtitle">Học bất cứ mọi nơi, mọi lúc và được hướng dẫn tận tình.</div>
    </div>
  );
};

export default Component8;
