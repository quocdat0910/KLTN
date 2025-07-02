import React from 'react';
import '../main.css'; // Import the CSS file
import { navigate } from "react-router-dom";

const PracticeTest = () => {
  return (
    <div className="practice-test-container">
      {/* Background */}
      <div className="practice-background-div" />

      {/* Main White Card/Container for the form */}
      <div className="practice-main-card">
        {/* "Kiểm tra trình độ" title */}
        <div className="practice-main-title">Kiểm tra trình độ</div>

        {/* "Chọn môn học bạn quan tâm" text */}
        <div className="practice-section-title">Chọn môn học bạn quan tâm</div>

        {/* IELTS button/tag */}
        {/* Sử dụng thẻ <button> */}
        <button type="button" className="practice-subject-button practice-subject-button-ielts">
          IELTS
        </button>

        {/* TOEIC button/tag */}
        {/* Sử dụng thẻ <button> */}
        <button type="button" className="practice-subject-button practice-subject-button-toeic">
          TOEIC
        </button>

        {/* Họ và tên * */}
        <div className="practice-label-text practice-label-name">Họ và tên *</div>
        {/* Họ và tên Input Field */}
        {/* Sử dụng thẻ <input> */}
        <input
          type="text"
          className="practice-input-field practice-input-name"
          placeholder="Họ và tên"
        />

        {/* Số điện thoại * */}
        <div className="practice-label-text practice-label-phone">Số điện thoại *</div>
        {/* Số điện thoại Input Field */}
        {/* Sử dụng thẻ <input> */}
        <input
          type="tel" // type="tel" cho số điện thoại
          className="practice-input-field practice-input-phone"
          placeholder="Số điện thoại"
        />

        {/* Tỉnh/thành phố * */}
        <div className="practice-label-text practice-label-city">Tỉnh/thành phố *</div>
        {/* Tỉnh/thành phố Input Field */}
        {/* Sử dụng thẻ <input> */}
        <input
          type="text"
          className="practice-input-field practice-input-city"
          placeholder="Tỉnh/thành phố" // Đã đổi placeholder cho đúng ngữ nghĩa
        />

        {/* "Bắt đầu làm bài" Button */}
        {/* Sử dụng thẻ <button> */}
        <button type="submit" className="practice-start-button" onClick={() => navigate("/t")}>
          Bắt đầu làm bài
        </button>
      </div>
    </div>
  );
};

export default PracticeTest;