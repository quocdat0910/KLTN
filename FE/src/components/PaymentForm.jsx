import React from 'react';
import '../main.css';

const PaymentForm = () => {
  return (
    <div className="paymentForm-container">
      <div className="paymentForm-backgroundBox" />
      <div className="paymentForm-description">
        Khóa học TOEIC 600+ giúp các bạn cải thiện khả năng tiếng anh để đạt được mức điểm từ 600+ trở lên
      </div>
      <img className="paymentForm-image" src="Component4a.jpg" alt="Khóa học TOEIC 600+" />
      <div className="paymentForm-courseTitle">Khóa học TOEIC 600+</div>

      <div className="paymentForm-sidePanel" />
      <div className="paymentForm-sideTitle">Chi tiết thanh toán</div>
      <div className="paymentForm-totalLabel">Tổng</div>
      <div className="paymentForm-courseName">Khóa học TOEIC 600+</div>
      <div className="paymentForm-priceLabel">Giá</div>
      <div className="paymentForm-divider top" />
      <div className="paymentForm-divider bottom" />
      <div className="paymentForm-priceValue">1.000.000 VND</div>
      <div className="paymentForm-totalValue">1.000.000 VND</div>

      <input className="paymentForm-discountInput" type="text" placeholder="Nhập mã giảm giá" />
      <button className="paymentForm-applyButton">Áp dụng</button>

      <button className="paymentForm-payButton">
        Thanh toán
      </button>
    </div>
  );
};

export default PaymentForm;
