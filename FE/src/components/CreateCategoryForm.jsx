// src/components/CreateAccountForm.jsx
import '../Component.css';

const CreateCategoryForm = ({ onClose }) => {
  return (
    <div className="form-overlay">
      <div className="create-form2">
        <h2 className="form-title">Tạo khóa học</h2>

        <label className="form-label">Tên khóa học</label>
        <input type="text" className="form-input" placeholder="Họ và tên" />

        <label label className="form-label">Mô tả</label>
        <input type="text" className="form-input" placeholder="Mô tả" />

        <div className="form-buttons">
          <button className="cancel-button" onClick={onClose}>Hủy</button>
          <button className="create-button">Tạo</button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryForm;
