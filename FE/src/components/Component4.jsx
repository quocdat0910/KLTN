import React from 'react';
import '../main.css';

const Component4 = () => {
  return (
    <div className="component4-container">
      <div className="component4-background" />

      {/* Nút "Hiển thị thêm 6" */}
      <button className="component4-button-more">
        Hiển thị thêm 6
      </button>

      {/* Nút "Thử 7 ngày miễn phí" */}
      <button className="component4-button-free-trial">
        Thử 7 ngày miễn phí
      </button>

      {/* Thẻ học phần - Ví dụ 6 ô */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const left = [1070, 1070, 774, 774, 479, 479][i];
        const top = [48, 387, 48, 387, 48, 387][i];
        return (
          <div className="component4-card" style={{ left, top }} key={i}>
            <div className="component4-card-bg" />
            <img className="component4-main-img" src="Component4a.jpg" alt="thumbnail" />
            <img className="component4-avatar" src="Component4b.jpg" alt="avatar" />
            <div className="component4-title">Các yếu tố cần thiết để điểm cao</div>
            <div className="component4-subtitle">Sơ cấp - Khóa học</div>
          </div>
        );
      })}

      <div className="component4-title-main">
        Kỹ năng nghề nghiệp <br />hiệu quả
      </div>
    </div>
  );
};

export default Component4;
