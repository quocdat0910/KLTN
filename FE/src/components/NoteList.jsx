// NoteList.jsx
import React from 'react';
import '../main2.css'; // Đảm bảo đường dẫn CSS là chính xác

const NoteList = ({ notes, onClose }) => {
  return (
    <div className="note-list-modal-content">
      <div className="note-list-header">
        <h3 className="note-list-title">Ghi chú của tôi</h3>
        <button className="note-list-close-btn" onClick={onClose}>&times;</button> {/* Nút đóng */}
      </div>
      <div className="note-list-body">
        {notes.length === 0 ? (
          <p className="no-notes-message">Bạn chưa có ghi chú nào.</p>
        ) : (
          <ul className="notes-display-list">
            {notes.map((note) => (
              <li key={note.id} className="note-item-display">
                <div className="note-item-timestamp">{note.timestamp}</div>
                <div className="note-item-content">{note.content}</div>
                {/* Bạn có thể thêm thông tin chương/bài học tại đây nếu muốn */}
                {/* <div className="note-item-context">{note.chapter} - {note.lesson}</div> */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NoteList;