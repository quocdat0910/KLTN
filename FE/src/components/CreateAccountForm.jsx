// src/components/CreateAccountForm.jsx
import React, { useState, useEffect } from 'react';
import '../Component.css'; // Đảm bảo import CSS
import axios from "axios";

// Thêm prop fetchUsersCallback để gọi lại sau khi hoàn thành
const CreateAccountForm = ({ onClose, userToEdit, fetchUsersCallback }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '', // Thêm trường confirmPassword
    role: '',
    dateOfBirth: '2000-01-01',
    address: 'Default Address',
  });
  const [isEditing, setIsEditing] = useState(false); // State để biết đang chỉnh sửa hay tạo mới

  // ⭐ useEffect để điền dữ liệu form khi có userToEdit ⭐
  useEffect(() => {
    if (userToEdit) {
      setIsEditing(true);
      setFormData({
        firstName: userToEdit.firstName || '',
        lastName: userToEdit.lastName || '',
        email: userToEdit.email || '',
        phone: userToEdit.phone || '',
        // Chuyển đổi giá trị gender và role từ API sang định dạng hiển thị trong form
        gender: userToEdit.gender === 'male' ? 'Nam' : (userToEdit.gender === 'female' ? 'Nữ' : ''),
        password: '', // Không điền mật khẩu cũ, người dùng sẽ nhập mật khẩu mới nếu muốn thay đổi
        confirmPassword: '', // Đặt trống để người dùng nhập lại nếu muốn đổi mật khẩu
        role: userToEdit.role === 'admin' ? 'Admin' : (userToEdit.role === 'student' ? 'User' : ''),
        dateOfBirth: userToEdit.dateOfBirth ? userToEdit.dateOfBirth.split('T')[0] : '2000-01-01', // Cắt bỏ phần thời gian nếu có
        address: userToEdit.address || 'Default Address',
      });
    } else {
      setIsEditing(false);
      // Reset form cho trường hợp tạo mới
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        password: '',
        confirmPassword: '',
        role: '',
        dateOfBirth: '2000-01-01',
        address: 'Default Address',
      });
    }
  }, [userToEdit]); // Chạy lại khi userToEdit thay đổi

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Chuyển đổi định dạng gender và role gửi lên API
    const payload = {
      ...formData,
      gender: formData.gender === 'Nam' ? 'male' : (formData.gender === 'Nữ' ? 'female' : ''),
      role: formData.role === 'Admin' ? 'admin' : (formData.role === 'User' ? 'student' : ''),
    };

    // ⭐ Xử lý mật khẩu và xác nhận mật khẩu ⭐
    // Nếu đang tạo mới, hoặc đang chỉnh sửa mà người dùng có nhập mật khẩu
    if (!isEditing || (isEditing && formData.password)) {
        if (payload.password !== payload.confirmPassword) {
            alert('Mật khẩu và xác nhận mật khẩu không khớp.');
            return;
        }
    }
    delete payload.confirmPassword; // Xóa confirmPassword khỏi payload trước khi gửi

    // Nếu đang chỉnh sửa và mật khẩu không được nhập, xóa trường mật khẩu khỏi payload
    if (isEditing && !payload.password) {
      delete payload.password;
    }

    // Validation cơ bản phía client
    // Yêu cầu mật khẩu chỉ khi tạo mới
    if (!payload.email || (!isEditing && !payload.password) || !payload.firstName || !payload.lastName || !payload.gender || !payload.phone || !payload.role) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    try {
      const adminToken = localStorage.getItem('token');
      if (!adminToken) {
        alert('Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
        return;
      }

      const API_URL_BASE = 'http://localhost:4000/api/v1/users'; // URL cơ sở

      let response;
      if (isEditing) {
        // ⭐ Gửi yêu cầu PUT/PATCH để cập nhật ⭐
        response = await axios.put(`${API_URL_BASE}/${userToEdit._id}`, payload, { // Sử dụng axios.put
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          withCredentials: true,
        });
      } else {
        // ⭐ Gửi yêu cầu POST để tạo mới ⭐
        response = await axios.post(API_URL_BASE, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          withCredentials: true,
        });
      }

      if (response.status === 200 || response.status === 201) { // 200 OK cho PUT, 201 Created cho POST
        alert(response.data.message || (isEditing ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản thành công!'));
        onClose(); // Đóng form
        if (fetchUsersCallback) {
            fetchUsersCallback(); // Gọi callback để refresh danh sách user
        }
      } else {
        alert(response.data.message || 'Có lỗi xảy ra.');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Không thể kết nối đến server. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="form-overlay">
      <div className="create-form3">
        <h2 className="form-title">{isEditing ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}</h2>

        <form onSubmit={handleSubmit}>
          {/* Nhóm các trường vào các container Flexbox */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Họ</label>
              <input
                type="text"
                className="form-input"
                placeholder="Họ"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tên</label>
              <input
                type="text"
                className="form-input"
                placeholder="Tên"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isEditing} // Không cho phép chỉnh sửa email khi đang chỉnh sửa tài khoản
              />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="tel"
                className="form-input"
                placeholder="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày sinh</label>
              <input
                type="date"
                className="form-input"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Giới tính</label>
              <select
                className="form-input"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          {/* ⭐ Địa chỉ và Vai trò cùng hàng ⭐ */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Địa chỉ</label>
              <input
                type="text"
                className="form-input"
                placeholder="Địa chỉ"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vai trò</label>
              <select
                className="form-input"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">Chọn vai trò</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>
          </div>

          {/* Mật khẩu và Xác nhận mật khẩu */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{isEditing ? 'Mật khẩu mới' : 'Mật khẩu'}</label>
              <input
                type="password"
                className="form-input"
                placeholder={isEditing ? 'Để trống nếu không thay đổi' : 'Mật khẩu'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditing}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isEditing ? 'Xác nhận mật khẩu mới' : 'Xác nhận mật khẩu'}</label>
              <input
                type="password"
                className="form-input"
                placeholder={isEditing ? 'Xác nhận mật khẩu mới' : 'Xác nhận mật khẩu'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isEditing || (isEditing && formData.password !== '')}
              />
            </div>
          </div>
          
          <div className="form-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="create-button">{isEditing ? 'Cập nhật' : 'Tạo tài khoản'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountForm;