import React, { useState } from 'react';

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

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div style={{
      maxWidth: 1540,
      // margin: '20px auto',
      padding: '50px 22px',
      height: '100%',
      background: 'rgba(229, 245, 255, 0.8)',
      borderRadius: 40,
      boxSizing: 'border-box',
    }}>
      <h2 style={{textAlign: 'center', marginBottom: 32}}>Câu hỏi thường gặp về TOEIC & IELTS</h2>
      {randomFaqs.map((faq, idx) => (
        <div key={idx} style={{marginBottom: 18, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fff'}}>
          <button
            onClick={() => handleToggle(idx)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              outline: 'none',
              padding: '18px 24px',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 10,
              color: '#1a237e',
              transition: 'background 0.18s',
            }}
          >
            {faq.question}
            <span style={{float: 'right', fontWeight: 400}}>{openIndex === idx ? '▲' : '▼'}</span>
          </button>
          {openIndex === idx && (
            <div style={{padding: '0 24px 18px 24px', color: '#333', fontSize: 16, animation: 'fadeIn 0.3s'}}>
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Component7;
