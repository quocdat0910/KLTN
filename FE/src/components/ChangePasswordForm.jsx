// src/components/CreateAccountForm.jsx
import '../main.css';

const ChangePassWordForm = ({ onClose }) => {
  return (
    <div className="form-overlay">
      <div className="create-form">
        <h2 className="form-title">Đổi mật khẩu</h2>

        <label className="form-label">Mật khẩu cũ</label>
        <input type="text" className="form-input" placeholder="Mật khẩu cũ" />

        <label className="form-label">Mật khẩu mới</label>
        <input type="email" className="form-input" placeholder="Mật khẩu mới" />

        <label className="form-label">Nhập lại mật khẩu mới</label>
        <input type="email" className="form-input" placeholder="Mật khẩu mới" />

        <div className="form-buttons">
          <button className="cancel-button" onClick={onClose}>Hủy</button>
          <button className="create-button">Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassWordForm;
