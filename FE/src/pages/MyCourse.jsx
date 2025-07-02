import React from 'react';
import '../main.css'; // Import the CSS file

const MyCourse = () => {
  return (
    <div className="my-course-container">
      <div className="my-course-title">
        Khóa học của tôi
      </div>

      {/* Course Card 1 */}
      <div className="course-card course-card-1">
        <img className="course-image" src="/Component4a.jpg" alt="TOEIC" />
        <img className="university-logo" src="/Component4b.jpg" alt="University of Cambridge Logo" />
        <div className="course-title">Các yếu tố cần thiết để điểm cao</div>
        <div className="course-level">Sơ cấp - Khóa học</div>
        <div className="progress-bar-track"></div>
        <div className="progress-bar-fill"></div>
      </div>

      {/* Course Card 2 */}
      <div className="course-card course-card-2">
        <img className="course-image" src="/Component4a.jpg" alt="TOEIC" />
        <img className="university-logo" src="/Component4b.jpg" alt="University of Cambridge Logo" />
        <div className="course-title">Các yếu tố cần thiết để điểm cao</div>
        <div className="course-level">Sơ cấp - Khóa học</div>
        <div className="progress-bar-track"></div>
        <div className="progress-bar-fill"></div>
      </div>

      {/* Course Card 3 */}
      <div className="course-card course-card-3">
        <img className="course-image" src="/Component4a.jpg" alt="TOEIC" />
        <img className="university-logo" src="/Component4b.jpg" alt="University of Cambridge Logo" />
        <div className="course-title">Các yếu tố cần thiết để điểm cao</div>
        <div className="course-level">Sơ cấp - Khóa học</div>
        <div className="progress-bar-track"></div>
        <div className="progress-bar-fill"></div>
      </div>

      {/* Course Card 4 */}
      <div className="course-card course-card-4">
        <img className="course-image" src="/Component4a.jpg" alt="TOEIC" />
        <img className="university-logo" src="/Component4b.jpg" alt="University of Cambridge Logo" />
        <div className="course-title">Các yếu tố cần thiết để điểm cao</div>
        <div className="course-level">Sơ cấp - Khóa học</div>
        <div className="progress-bar-track"></div>
        <div className="progress-bar-fill"></div>
      </div>
    </div>
  );
};

export default MyCourse;