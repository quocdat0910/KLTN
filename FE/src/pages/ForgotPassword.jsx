import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../main.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.post('http://localhost:4000/api/v1/users/forgot-password', { email });
      setMessage(res.data.message || 'Vui lòng kiểm tra email để đặt lại mật khẩu.');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-left">
          <h1>Quên mật khẩu?</h1>
          <p>Nhập email bạn đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p>
        </div>
        <div className="login-right">
          <h2>Đặt lại mật khẩu</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn"
              disabled={loading}
            />
            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
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

export default ForgotPassword;