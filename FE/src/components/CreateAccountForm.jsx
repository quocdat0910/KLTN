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

    const adminToken = localStorage.getItem('token');
    if (!adminToken) {
      alert('Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
      return;
    }

    const API_URL_BASE = 'http://localhost:4000/api/v1/users'; // URL cơ sở

    try {
      if (isEditing) {
        // --- Xử lý cập nhật người dùng hiện có ---
        const { password, confirmPassword, ...restFormData } = formData;

        // Chuyển đổi định dạng gender và role gửi lên API
        const updatePayload = {
          ...restFormData,
          gender: restFormData.gender === 'Nam' ? 'male' : (restFormData.gender === 'Nữ' ? 'female' : ''),
          role: restFormData.role === 'Admin' ? 'admin' : (restFormData.role === 'User' ? 'student' : ''),
        };

        let response;
        if (password) {
          // Nếu có nhập mật khẩu, gọi API đổi mật khẩu riêng
          if (password !== confirmPassword) {
            alert('Mật khẩu mới và xác nhận mật khẩu mới không khớp.');
            return;
          }

          const passwordPayload = {
            newPassword: password,
            confirmNewPassword: confirmPassword,
          };

          response = await axios.put(`${API_URL_BASE}/${userToEdit._id}/change-password`, passwordPayload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`,
            },
            withCredentials: true,
          });

          // Sau khi đổi mật khẩu thành công, có thể cập nhật các thông tin khác nếu muốn
          // hoặc refresh danh sách người dùng. Ở đây ta chỉ thông báo thành công và đóng form.
          if (response.status === 200) {
            alert(response.data.message || 'Đổi mật khẩu thành công!');
            onClose();
            if (fetchUsersCallback) {
              fetchUsersCallback();
            }
            return; // Dừng lại sau khi đổi mật khẩu
          }
        } else {
          // Nếu không nhập mật khẩu, chỉ cập nhật thông tin chung
          // Validation cơ bản phía client cho trường hợp cập nhật thông tin
          if (!updatePayload.email || !updatePayload.firstName || !updatePayload.lastName || !updatePayload.gender || !updatePayload.phone || !updatePayload.role) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
          }

          response = await axios.put(`${API_URL_BASE}/${userToEdit._id}`, updatePayload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`,
            },
            withCredentials: true,
          });

          if (response.status === 200) {
            alert(response.data.message || 'Cập nhật tài khoản thành công!');
            onClose();
            if (fetchUsersCallback) {
              fetchUsersCallback();
            }
          }
        }
      } else {
        // --- Xử lý tạo người dùng mới ---
        const payload = {
          ...formData,
          gender: formData.gender === 'Nam' ? 'male' : (formData.gender === 'Nữ' ? 'female' : ''),
          role: formData.role === 'Admin' ? 'admin' : (formData.role === 'User' ? 'student' : ''),
        };

        if (payload.password !== payload.confirmPassword) {
          alert('Mật khẩu và xác nhận mật khẩu không khớp.');
          return;
        }
        delete payload.confirmPassword; // Xóa confirmPassword khỏi payload trước khi gửi

        // Validation cơ bản phía client cho trường hợp tạo mới
        if (!payload.email || !payload.password || !payload.firstName || !payload.lastName || !payload.gender || !payload.phone || !payload.role) {
          alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
          return;
        }

        const response = await axios.post(API_URL_BASE, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          withCredentials: true,
        });

        if (response.status === 201) { // 201 Created cho POST
          alert(response.data.message || 'Tạo tài khoản thành công!');
          onClose(); // Đóng form
          if (fetchUsersCallback) {
            fetchUsersCallback(); // Gọi callback để refresh danh sách user
          }
        }
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
                // Trường xác nhận mật khẩu chỉ bắt buộc nếu đã nhập mật khẩu mới
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