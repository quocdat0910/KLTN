import React, { useState } from 'react';
import '../main.css';
import PaymentForm from '../components/PaymentForm';

const ProductDetail = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleBuyClick = () => {
    setShowPaymentForm(true);
  };

  const handleClosePaymentForm = () => {
    setShowPaymentForm(false);
  };

  return (
    <div className="detail-container">
      <div className="detail-bg" />

      <div className="detail-minus">-</div>

      <div className="detail-chapter-box detail-chapter-1" />
      <div className="detail-chapter-title detail-title-1">- Chương 1: Giới thiệu</div>

      <div className="detail-chapter-box detail-chapter-2" />
      <div className="detail-chapter-title detail-title-2">+ Chương 2: Tên chương 2</div>

      <div className="detail-chapter-box detail-chapter-3" />
      <div className="detail-chapter-title detail-title-3">+ Chương 3: Tên chương 4</div>

      <div className="detail-chapter-box detail-chapter-4" />
      <div className="detail-chapter-title detail-title-4">+ Chương 4: Tên chương 4</div>

      <div className="detail-section-title">Giới thiệu</div>

      <img className="detail-icon-img2" src="video.png" alt="Icon" />

      <div className="detail-main-title">TOEIC 600+</div>
      <div className="detail-content-title">Nội dung khóa học</div>
      <div className="detail-description">
        Khóa học TOEIC 600+ giúp các bạn cải thiện khả năng tiếng anh để đạt được mức điểm từ 600+ trở lên
      </div>

      <div className="detail-info detail-info-chapter">11 chương</div>
      <div className="detail-info detail-info-duration">Thời lượng: 3 giờ 50 phút</div>

      <div className="detail-price">1.000.000 VND</div>

      <div className="detail-buy-button" onClick={handleBuyClick}>
        <div className="detail-buy-button-text">Mua khóa học</div>
      </div>

      <div className="detail-feature detail-feature-1">- Trình độ khá</div>
      <div className="detail-feature detail-feature-2">- Tổng 4 chương</div>
      <div className="detail-feature detail-feature-3">- Thời lượng: 3 giờ 50 phút</div>
      <div className="detail-feature detail-feature-4">- Học mọi lúc mọi nơi</div>

      <img className="detail-course-img" src="Component4a.jpg" alt="Course" />

      <div className="detail-subtitle">Bài tập</div>
      <img className="detail-icon-img" src="homework.png" alt="Icon" />

      {/* Hiển thị form thanh toán */}
      {showPaymentForm && (
        <div className="payment-overlay">
          <PaymentForm />
          <button className="payment-close-button" onClick={handleClosePaymentForm}>
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
