import React, { useState } from 'react';
import '../main.css';
import ChangePassWordForm from '../components/ChangePasswordForm';

const Account = () => {
  const [form, setForm] = useState({
    firstName: 'NGUYỄN',
    lastName: 'QUỐC ĐẠT',
    email: 'DAT@GMAIL.COM',
    dob: '2003-10-09',
    gender: 'NAM',
    phone: '0902660951',
  });

  const [avatar, setAvatar] = useState('user.png');
  const [showChangePassword, setShowChangePassword] = useState(false); // NEW

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    alert('Ảnh đại diện và số điện thoại đã được lưu.');
  };

  const handlePasswordChange = () => {
    setShowChangePassword(true); // Hiện form đổi mật khẩu
  };

  const closePasswordForm = () => {
    setShowChangePassword(false); // Ẩn form
  };

  return (
    <div className="account-wrapper">
      {showChangePassword && <ChangePassWordForm onClose={closePasswordForm} />}

      <div className="account-left">
        <div className="avatar">
          <img src={avatar} alt="avatar" />
        </div>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button className="blue-btn" onClick={handleSubmit}>Lưu thay đổi</button>

        <div className="account-left2">
          <h2>Đổi mật khẩu</h2>
          <button className="blue-btn" onClick={handlePasswordChange}>Đổi mật khẩu</button>
        </div>
      </div>

      <div className="account-right">
        <h1>Thông tin cá nhân</h1>
        <div className="form-grid">
          <div className="form-group">
            <label>Họ</label>
            <input name="firstName" value={form.firstName} disabled />
          </div>
          <div className="form-group">
            <label>Tên</label>
            <input name="lastName" value={form.lastName} disabled />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" value={form.email} disabled />
          </div>
          <div className="form-group2">
            <label>SDT</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Ngày sinh</label>
            <input type="date" name="dob" value={form.dob} disabled />
          </div>
          <div className="form-group">
            <label>Giới tính</label>
            <input name="gender" value={form.gender} disabled />
          </div>
        </div>
        <button className="blue-btn" onClick={handleSubmit}>Lưu thay đổi</button>
      </div>
    </div>
  );
};

export default Account;
