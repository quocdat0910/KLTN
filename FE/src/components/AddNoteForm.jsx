// AddNoteForm.jsx
import React, { useState, useEffect } from 'react';
import '../main2.css'; // Đảm bảo đường dẫn CSS là chính xác

const AddNoteForm = ({ timestamp, onSave, onCancel }) => {
  const [noteContent, setNoteContent] = useState('');

  // Cập nhật nội dung input khi timestamp thay đổi (nếu muốn)
  useEffect(() => {
    // Có thể bạn muốn reset noteContent mỗi khi timestamp thay đổi
    // setNoteContent('');
  }, [timestamp]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (noteContent.trim()) {
      onSave(noteContent, timestamp); // Gọi hàm lưu từ component cha
    } else {
      alert("Vui lòng nhập nội dung ghi chú.");
    }
  };

  return (
    <div className="add-note-form-container">
      <h3 className="add-note-form-title">Thêm ghi chú tại <span className="note-timestamp">{timestamp}</span></h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="noteContent" className="sr-only">Nội dung ghi chú</label>
          <textarea
            id="noteContent"
            className="note-textarea"
            placeholder="Ghi chú của tôi"
            rows="4"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          ></textarea>
        </div>
        <div className="add-note-form-actions">
          <button type="button" className="note-btn note-btn-cancel" onClick={onCancel}>
            Hủy bỏ
          </button>
          <button type="submit" className="note-btn note-btn-save">
            Tạo ghi chú
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddNoteForm;