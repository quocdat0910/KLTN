import React from 'react';
import '../main.css';

const Component9 = () => {
  return (
    <div className="component9">
      <div className="component9-background" />
      <img
        className="component9-intro-image"
        src="aboutus.jpg"
        alt="Giới thiệu"
      />
      <div className="component9-heading component9-gioi-thieu">Giới thiệu</div>
      <div className="component9-heading component9-su-menh">Sứ mệnh</div>
      <div className="component9-description component9-gioi-thieu-text">
        Chúng tôi là nền tảng học trực tuyến chuyên biệt dành cho người học tiếng Anh đang chuẩn bị
        cho các kỳ thi TOEIC và IELTS.
        <br />
        Sứ mệnh của chúng tôi là mang đến lộ trình học tập cá nhân hóa cho từng học viên thông qua
        công nghệ AI tiên tiến, giúp người học đạt được mục tiêu cải thiện năng lực ngôn ngữ một
        cách hiệu quả.
      </div>
      <div className="component9-description component9-su-menh-text">
        Chúng tôi cam kết hỗ trợ người học vượt qua các kỳ thi tiếng Anh quốc tế bằng các khóa học
        trực tuyến được thiết kế tương tác và phù hợp theo từng trình độ.
        <br />
        Với việc ứng dụng trí tuệ nhân tạo, chúng tôi mang đến trải nghiệm học tập thông minh, linh
        hoạt và tối ưu, đồng hành cùng người học trên hành trình chinh phục tri thức.
      </div>
      <img
        className="component9-mission-image"
        src="mission.jpg"
        alt="Sứ mệnh"
      />
    </div>
  );
};

export default Component9;
