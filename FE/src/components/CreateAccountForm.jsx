// src/components/CreateAccountForm.jsx
import '../Component.css';

const CreateAccountForm = ({ onClose }) => {
  return (
    <div className="form-overlay">
      <div className="create-form">
        <h2 className="form-title">Tạo tài khoản</h2>

        <label className="form-label">Họ và tên</label>
        <input type="text" className="form-input" placeholder="Họ và tên" />

        <label className="form-label">Email</label>
        <input type="email" className="form-input" placeholder="Email" />

        <label className="form-label">Mật khẩu</label>
        <input type="password" className="form-input" placeholder="Mật khẩu" />

        <label className="form-label">Vai trò</label>
        <select className="form-input">
          <option>Chọn vai trò</option>
          <option>Admin</option>
          <option>User</option>
        </select>
        <div className="form-buttons">
          <button className="cancel-button" onClick={onClose}>Hủy</button>
          <button className="create-button">Tạo</button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountForm;
