import React, { useState, useRef, useEffect } from 'react';

const faqs = [
  {
    question: 'Khóa học TOEIC này phù hợp với trình độ nào?',
    answer: 'Khóa học TOEIC được thiết kế cho mọi trình độ, từ cơ bản đến nâng cao. Bạn sẽ được kiểm tra đầu vào để chọn lộ trình phù hợp nhất.'
  },
  {
    question: 'Tôi có thể học thử miễn phí không?',
    answer: 'Bạn hoàn toàn có thể học thử miễn phí một số bài học đầu tiên để trải nghiệm chất lượng trước khi quyết định đăng ký.'
  },
  {
    question: 'Khóa học IELTS có giáo viên bản ngữ không?',
    answer: 'Chúng tôi có đội ngũ giáo viên bản ngữ và Việt Nam giàu kinh nghiệm, giúp bạn luyện phát âm và kỹ năng giao tiếp chuẩn quốc tế.'
  },
  {
    question: 'Sau bao lâu tôi có thể đạt được mục tiêu điểm TOEIC/IELTS?',
    answer: 'Thời gian đạt mục tiêu phụ thuộc vào trình độ hiện tại và sự chăm chỉ của bạn. Trung bình học viên tăng 150-200 điểm TOEIC hoặc 1-1.5 band IELTS sau 3-6 tháng.'
  },
  {
    question: 'Khóa học có hỗ trợ luyện thi thử không?',
    answer: 'Có! Bạn sẽ được làm các bài thi thử sát đề thật, có chấm điểm và nhận nhận xét chi tiết từ giáo viên.'
  },
  {
    question: 'Tôi có được hỗ trợ giải đáp thắc mắc ngoài giờ học không?',
    answer: 'Bạn sẽ được tham gia group học viên và được giáo viên hỗ trợ giải đáp thắc mắc 24/7.'
  },
  {
    question: 'Học phí có thể đóng theo từng tháng không?',
    answer: 'Bạn có thể lựa chọn đóng học phí theo tháng hoặc trọn gói, linh hoạt theo nhu cầu cá nhân.'
  },
  {
    question: 'Khóa học có tài liệu luyện nghe, nói, đọc, viết không?',
    answer: 'Tất cả các kỹ năng đều có tài liệu và bài tập thực hành, giúp bạn phát triển toàn diện.'
  },
  {
    question: 'Tôi có thể học trên điện thoại không?',
    answer: 'Bạn có thể học mọi lúc, mọi nơi trên cả máy tính và điện thoại với giao diện tối ưu.'
  },
  {
    question: 'Sau khi kết thúc khóa học, tôi có được cấp chứng chỉ không?',
    answer: 'Sau khi hoàn thành khóa học và vượt qua bài kiểm tra cuối khóa, bạn sẽ nhận được chứng chỉ hoàn thành.'
  }
];

function getRandomFaqs(arr, n) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

const Component7 = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const randomFaqs = getRandomFaqs(faqs, 6);
  const faqRef = useRef(null);

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  useEffect(() => {
    if (faqRef.current) {
      const yOffset = -80; // offset cho navbar (80px)
      const y = faqRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="faq-container" ref={faqRef}>
      <h2 className="faq-title">Câu hỏi thường gặp về TOEIC & IELTS</h2>
      <div className="faq-list">
        {randomFaqs.map((faq, idx) => (
          <div key={idx} className={`faq-item${openIndex === idx ? ' open' : ''}`}> 
            <button
              className="faq-question-btn"
              onClick={() => handleToggle(idx)}
            >
              {faq.question}
              <span className="faq-arrow">{openIndex === idx ? '\u25b2' : '\u25bc'}</span>
            </button>
            {openIndex === idx && (
              <div className="faq-answer">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Component7;
