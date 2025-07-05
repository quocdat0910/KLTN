import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../main.css'; // Import the CSS file

const MyCourse = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Bạn cần đăng nhập để xem khóa học của mình');
          setLoading(false);
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:4000/api/v1/enrollments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.enrollments) {
          // Lọc chỉ các khóa học đã thanh toán hoặc trạng thái active/completed
          const paidCourses = response.data.enrollments.filter(e => (e.paymentDetails?.amount > 0) || ['active','completed'].includes(e.status));
          setEnrollments(paidCourses);
          console.log("Số lượng khóa học đã thanh toán:", paidCourses.length);
        } else {
          setError('Không tìm thấy dữ liệu đăng ký khóa học');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Lỗi khi tải danh sách khóa học');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [navigate]);

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang học';
      case 'completed': return 'Đã hoàn thành';
      case 'expired': return 'Đã hết hạn';
      default: return 'Không xác định';
    }
  };

  if (loading) return (
    <div className="my-course-container">
      <div className="my-course-title">Khóa học của tôi</div>
      <div className="my-course-loading">Đang tải danh sách khóa học...</div>
    </div>
  );
  if (error) return (
    <div className="my-course-container">
      <div className="my-course-title">Khóa học của tôi</div>
      <div className="my-course-error">
        <p>{error}</p>
        <button className="blue-btn" onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="my-course-container">
      <div className="my-course-title">Khóa học của tôi ({enrollments.length})</div>
      {enrollments.length === 0 ? (
        <div className="my-course-empty">
          <p>Bạn chưa có khóa học đã thanh toán nào.</p>
          <button className="blue-btn" onClick={() => navigate('/productcat')}>Khám phá khóa học</button>
        </div>
      ) : (
        <div className="my-course-grid">
          {enrollments.map((enrollment) => (
            <div className="course-card" key={enrollment._id} onClick={() => handleCourseClick(enrollment.courseId._id)}>
              <img className="course-image" src={enrollment.courseId.thumbnail} alt={enrollment.courseId.title} onError={e => { e.target.onerror = null; e.target.src = '/Component4a.jpg'; }} />
              <div className="course-card-content">
                <div>
                  <div className="course-title">{enrollment.courseId.title}</div>
                  <div className="course-level">{enrollment.courseId.shortDescription || 'Chưa có mô tả'}</div>
                </div>
                <div className="status-row">
                  <span className={`status-text status-${enrollment.status}`}>{getStatusText(enrollment.status)}</span>
                  <span className="enrollment-date">Đăng ký: {formatDate(enrollment.enrolledAt)}</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill"></div>
                </div>
                <div className="payment-row">
                  <span>Thanh toán: {enrollment.paymentDetails?.paymentMethod === 'paypal' ? 'PayPal' : 'Miễn phí'}</span>
                  {enrollment.paymentDetails?.amount > 0 && (
                    <span>{enrollment.paymentDetails.amount.toLocaleString('vi-VN')} VNĐ</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourse;