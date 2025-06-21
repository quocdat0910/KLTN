// src/pages/Account.jsx
import React, { useState, useEffect } from 'react';
import '../main.css';
import ChangePassWordForm from '../components/ChangePasswordForm';

const Account = () => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', dateOfBirth: '', gender: '', phone: '', address: ''
  });
  const [avatar, setAvatar] = useState('/user.png'); // Vẫn giữ mặc định ban đầu
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');

      const res = await fetch('http://localhost:4000/api/v1/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Không thể lấy thông tin người dùng.');
      }

      const { user } = await res.json();
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        phone: user.phone || '',
        address: user.address || ''
      });

      // ⭐⭐⭐ LOGIC ĐƯỢC SỬA ĐỔI TẠI ĐÂY ⭐⭐⭐
      // Xác định URL avatar mặc định mà backend của bạn đang gửi từ Cloudinary.
      // BẠN PHẢI THAY THẾ 'your_cloud_name' BẰNG TÊN CLOUD THỰC TẾ CỦA BẠN.
      // Dựa trên hình ảnh bạn cung cấp: https://res.cloudinary.com/your_cloud_name/image/upload/v1/default_avatar.png
      const defaultCloudinaryAvatarUrl = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default_avatar.png'; 
      // (Nếu bạn không chắc chắn về "your_cloud_name", hãy kiểm tra cấu hình Cloudinary trong backend của bạn hoặc log user.avatar khi nó trả về)

      if (user.avatar && user.avatar !== defaultCloudinaryAvatarUrl) {
        setAvatar(user.avatar); // Nếu có avatar và nó KHÁC với avatar mặc định của Cloudinary
      } else {
        setAvatar('/user.png'); // Nếu không có avatar, hoặc avatar là mặc định của Cloudinary, dùng avatar cục bộ
      }
      // ⭐⭐⭐ KẾT THÚC LOGIC SỬA ĐỔI ⭐⭐⭐

    } catch (err) {
      setError(err.message);
      setAvatar('/user.png'); // Đảm bảo avatar về mặc định nếu có lỗi khi fetch profile
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUserProfile(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result); // Hiển thị preview ảnh mới chọn
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token.');

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (selectedAvatarFile) formData.append('avatar', selectedAvatarFile);

      const res = await fetch('http://localhost:4000/api/v1/users/profile', {
        method: 'PUT',
        // KHÔNG CẦN Content-Type khi gửi FormData, trình duyệt sẽ tự đặt với boundary
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Cập nhật thông tin thất bại.');
      }

      const result = await res.json();
      alert(result.message || 'Thông tin đã được cập nhật.');
      fetchUserProfile(); // Lấy lại thông tin user sau khi cập nhật thành công
      setSelectedAvatarFile(null); // Reset file đã chọn sau khi gửi thành công

    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  if (loading) return <div className="app-main-content-wrapper"><p>Đang tải thông tin người dùng...</p></div>;
  if (error) return <div className="app-main-content-wrapper"><p style={{ color: 'red' }}>{error}</p></div>;

  const formatGenderDisplay = (gender) => gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';

  return (
    <div className="app-main-content-wrapper">
      <div className="account-wrapper">
        {showChangePassword && <ChangePassWordForm onClose={() => setShowChangePassword(false)} />}

        <div className="account-left">
          <div className="avatar">
            <img src={avatar} alt="avatar" />
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <button className="blue-btn" onClick={handleSubmit}>Lưu thay đổi</button>

          <div className="account-left2">
            <h2>Đổi mật khẩu</h2>
            <button className="blue-btn" onClick={() => setShowChangePassword(true)}>Đổi mật khẩu</button>
          </div>
        </div>

        <div className="account-right">
          <h1>Thông tin cá nhân</h1>
          <div className="form-grid">
            {[
              { label: 'Họ', name: 'firstName', disabled: false },
              { label: 'Tên', name: 'lastName', disabled: false },
              { label: 'Email', name: 'email', disabled: true },
              { label: 'SDT', name: 'phone', disabled: false },
              { label: 'Ngày sinh', name: 'dateOfBirth', type: 'date', disabled: true },
              { label: 'Giới tính', name: 'gender', value: formatGenderDisplay(form.gender), disabled: true },
              { label: 'Địa chỉ', name: 'address', disabled: false }
            ].map(({ label, name, type = 'text', disabled, value }) => (
              <div className="form-group" key={name}>
                <label>{label}</label>
                <input
                  name={name}
                  type={type}
                  value={value !== undefined ? value : form[name]}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
          <button className="blue-btn" onClick={handleSubmit}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};

export default Account;