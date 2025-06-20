// src/components/CreateAccountForm.jsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import '../Component.css';
import axios from "axios"; // Đảm bảo import axios

// ⭐ Thêm prop userToEdit ⭐
const CreateAccountForm = ({ onClose, userToEdit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    password: '', // Có thể không cần hiển thị hoặc chỉ cho phép thay đổi khi chỉnh sửa
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
        role: userToEdit.role === 'admin' ? 'Admin' : (userToEdit.role === 'student' ? 'User' : ''), // Giả sử 'User' tương ứng với 'student'
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
      role: formData.role === 'Admin' ? 'admin' : (formData.role === 'User' ? 'student' : ''), // Đảm bảo khớp với backend
    };

    // Nếu đang chỉnh sửa và mật khẩu không được nhập, xóa trường mật khẩu khỏi payload
    if (isEditing && !payload.password) {
      delete payload.password;
    }

    // Validation cơ bản phía client
    if (!payload.email || (!isEditing && !payload.password) || !payload.firstName || !payload.lastName || !payload.gender || !payload.phone || !payload.role) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        alert('Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
        return;
      }

      const API_URL = 'http://localhost:4000/api/v1/users'; // URL cơ sở

      let response;
      if (isEditing) {
        // ⭐ Gửi yêu cầu PUT/PATCH để cập nhật ⭐
        response = await axios.put(`${API_URL}/${userToEdit._id}`, payload, { // Sử dụng axios.put hoặc axios.patch
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          withCredentials: true,
        });
      } else {
        // ⭐ Gửi yêu cầu POST để tạo mới ⭐
        response = await axios.post(API_URL, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`, // Có thể backend của bạn không yêu cầu token khi tạo user, nhưng nếu có thì vẫn thêm vào
          },
          withCredentials: true,
        });
      }

      if (response.status === 200 || response.status === 201) { // 200 OK cho PUT, 201 Created cho POST
        alert(response.data.message || (isEditing ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản thành công!'));
        onClose(); // Đóng form và gọi callback để refresh dữ liệu
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
        <h2 className="form-title">{isEditing ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}</h2> {/* ⭐ Tiêu đề động ⭐ */}

        <form onSubmit={handleSubmit}>
          <label className="form-label">Họ</label>
          <input
            type="text"
            className="form-input"
            placeholder="Họ"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />

          <label className="form-label">Tên</label>
          <input
            type="text"
            className="form-input"
            placeholder="Tên"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />

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

          <label className="form-label">Ngày sinh (YYYY-MM-DD)</label>
          <input
            type="date"
            className="form-input"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />

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

          <label className="form-label">{isEditing ? 'Mật khẩu mới (để trống nếu không thay đổi)' : 'Mật khẩu'}</label> {/* ⭐ Text động ⭐ */}
          <input
            type="password"
            className="form-input"
            placeholder={isEditing ? 'Để trống nếu không thay đổi' : 'Mật khẩu'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            // Mật khẩu không bắt buộc khi chỉnh sửa
            required={!isEditing} 
          />

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
            <option value="User">User</option> {/* Giả sử User tương ứng với student */}
          </select>

          <div className="form-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="create-button">{isEditing ? 'Cập nhật' : 'Tạo tài khoản'}</button> {/* ⭐ Text nút động ⭐ */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountForm;