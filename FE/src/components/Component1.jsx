import React from 'react';
import '../main.css';

const Component1 = () => {
  
  return (
    <div className="component1-container animate-fade-in">
      <div className="component1-background" />
      <div className="component1-text">
        Học hỏi từ hơn 350 trường đại học và công ty hàng đầu
      </div>
      <img
        className="component1-image"
        src="component1.png"
        alt="Banner"
      />
    </div>
  );
};

export default Component1;
