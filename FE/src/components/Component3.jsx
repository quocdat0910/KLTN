import React from 'react';
import '../main.css';

const Component3 = () => {
  return (
    <div className="component3-container animate-fade-in">
      <div className="component3-background" />
      <div className="component3-title">Đầu tư vào khả năng tiếng Anh của bạn</div>
      <div className="component3-section section-left">
        <div className="section-title">Khám phá các kỹ năng mới</div>
        <div className="section-description">Truy cập 10,000 khóa học về ...</div>
      </div>
      <div className="component3-section section-middle">
        <div className="section-title">Kiếm chứng chỉ có giá trị</div>
        <div className="section-description">Nhận chứng chỉ ...</div>
      </div>
      <div className="component3-section section-right">
        <div className="section-title">Những người giỏi nhất</div>
        <div className="section-description">Được hướng dẫn bởi ...</div>
      </div>
      <div>
        <img className="component3-icon1" src="compass.png" alt="" />
      </div>
      <div>
        <img className="component3-icon2" src="verify.png" alt="" />
      </div>
      <div>
        <img className="component3-icon3" src="multiple-users-silhouette.png" alt="" />
      </div>
    </div>
  );
};

export default Component3;
