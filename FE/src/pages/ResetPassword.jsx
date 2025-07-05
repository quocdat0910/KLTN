import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../main.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy token từ query string (?token=...)
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/api/v1/users/reset-password', {
        token,
        password,
        confirmPassword
      });
      setMessage(res.data.message || 'Đặt lại mật khẩu thành công!');
      localStorage.removeItem('token');
      setTimeout(() => {
        navigate('/login');
      }, 1500); // Chờ 1.5s cho user đọc thông báo rồi chuyển về login
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-left">
            <h1>Đặt lại mật khẩu</h1>
            <p>Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          </div>
          <div className="login-right">
            <button className="login-button" onClick={() => navigate('/login')}>Quay lại đăng nhập</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-left">
          <h1>Đặt lại mật khẩu</h1>
          <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
        </div>
        <div className="login-right">
          <h2>Tạo mật khẩu mới</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="password">Mật khẩu mới</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu mới"
              disabled={loading}
            />
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Nhập lại mật khẩu mới"
              disabled={loading}
            />
            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
          {message && <div className="success-message" style={{ marginTop: 16 }}>{message}</div>}
          {error && <div className="login-error" style={{ marginTop: 16, color: 'red' }}>{error}</div>}
          <div className="login-register-link" style={{ marginTop: 24 }}>
            <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#2176ae', fontWeight: 600 }}>Quay lại đăng nhập</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 