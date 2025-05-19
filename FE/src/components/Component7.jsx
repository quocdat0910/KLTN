import React from 'react';
import '../main.css';

const Component7 = () => {
  const questions = [
    "Tôi có thể dùng thử DA trước, để đảm bảo phù hợp với tôi không?",
    "Tôi có thể dùng thử DA trước, để đảm bảo phù hợp với tôi không?",
    "Tôi có thể dùng thử DA trước, để đảm bảo phù hợp với tôi không?"
  ];

  return (
    <div className="faq-wrapper">
      <div className="faq-title">Câu hỏi thường gặp</div>

      <div className="faq-box" />

      <div className="faq-showmore-bg" />
      <div className="faq-showmore-text">Hiển thị thêm câu hỏi thường gặp</div>

      <div className="faq-showmore-icon">
        <div className="icon-bg" />
        <svg className="icon-arrow" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 16l-6-6h12l-6 6z" />
</svg>

      </div>

  {questions.map((q, index) => (
  <React.Fragment key={index}>
    <img
      src="arrow-down-sign-to-navigate.png" // Đường dẫn tới icon
      alt="FAQ icon"
      className={`faq-icon faq-icon-${index}`}
    />
    <div className={`faq-question faq-question-${index}`}>{q}</div>
    <div className={`faq-divider faq-divider-${index}`} />
  </React.Fragment>
))}

    </div>
  );
};

export default Component7;
