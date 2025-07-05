// src/components/CreateAccountForm.jsx
import React, { useState } from 'react';
import '../main.css';

const ChangePasswordForm = ({ onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setError('Vui lòng nhập đầy đủ các trường.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/v1/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Đổi mật khẩu thất bại.');
      } else {
        setSuccess(data.message || 'Đổi mật khẩu thành công!');
        // Xóa token, chuyển về trang đăng nhập sau 2s
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err) {
      setError('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-overlay">
      <form className="create-form" onSubmit={handleSubmit}>
        <h2 className="form-title">Đổi mật khẩu</h2>
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 10 }}>{success}</div>}
        <label className="form-label">Mật khẩu cũ</label>
        <input type="password" className="form-input" placeholder="Mật khẩu cũ" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
        <label className="form-label">Mật khẩu mới</label>
        <input type="password" className="form-input" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <label className="form-label">Nhập lại mật khẩu mới</label>
        <input type="password" className="form-input" placeholder="Nhập lại mật khẩu mới" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
        <div className="form-buttons">
          <button className="cancel-button" type="button" onClick={onClose} disabled={loading}>Hủy</button>
          <button className="create-button" type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
