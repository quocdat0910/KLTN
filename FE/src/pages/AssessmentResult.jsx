import React from 'react';
import './AssessmentResult.css';

const skills = [
  { name: 'Grammar', status: 'Yếu', suggestion: 'Xem video' },
  { name: 'Vòng phẫu', status: 'Cần đỉnh', suggestion: 'Xem video luyện nói' },
  { name: 'Chữ ngữ', status: 'Cần cải thiện', suggestion: 'Làm bài tập thêm' },
];

const roadmap = [
  'Ôn lại các điểm ngữ pháp yếu.',
  'Luyện nghe các đoạn hội thoại thực tế.',
  'Thực hành nói với AI hoặc bạn học.',
];

export default function AssessmentResult() {
  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <img src="/logo.png" alt="Logo" className="assessment-logo" />
        <div className="assessment-nav">
          <a href="/">Trang chủ</a>
          <a href="/courses">Khóa học</a>
          <a href="/profile">Tài khoản</a>
        </div>
      </header>
      <main className="assessment-main">
        <div className="assessment-congrats">
          <span className="assessment-check">✔</span>
          <h1>Chúc mừng bạn đã hoàn thành bài kiểm tra!</h1>
          <p>Đây là phân tích cá nhân & lộ trình gợi ý dành riêng cho bạn.</p>
        </div>
        <div className="assessment-content">
          <section className="assessment-card assessment-chart">
            {/* Radar chart placeholder */}
            <div className="chart-placeholder">[Biểu đồ kỹ năng]</div>
          </section>
          <section className="assessment-card assessment-table">
            <h2>Phân tích kết quả</h2>
            <table>
              <thead>
                <tr>
                  <th>Kỹ năng</th>
                  <th>Trạng thái</th>
                  <th>Gợi ý</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((s, i) => (
                  <tr key={i}>
                    <td>{s.name}</td>
                    <td>{s.status}</td>
                    <td>{s.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="assessment-card assessment-roadmap">
            <h2>Lộ trình học tập cá nhân</h2>
            <ol>
              {roadmap.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <button className="assessment-btn">Bắt đầu lộ trình</button>
          </section>
          <section className="assessment-card assessment-next-lesson">
            <h2>Bài học thông minh</h2>
            <div className="next-lesson-info">
              <span>✔ Sẵn sàng giúp bạn cải thiện kỹ năng!</span>
              <button className="assessment-btn">Xem bài học tiếp theo</button>
            </div>
          </section>
        </div>
      </main>
      <footer className="assessment-footer">
        © {new Date().getFullYear()} DA. All rights reserved.
      </footer>
    </div>
  );
} 
