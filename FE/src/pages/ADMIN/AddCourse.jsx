import React, { useState } from "react";
import "../../Component.css";
import { Link, useNavigate } from "react-router-dom";
import AddChapter from "./AddChapter"; // Import AddChapter

function AddCourse() {
  const navigateTo = useNavigate(); // Giữ lại nếu bạn có các navigate khác

  const [fileUrl, setFileUrl] = useState("");
  const [files, setFiles] = useState([]);

  // State để quản lý danh sách các chương
  const [chapters, setChapters] = useState([]);
  // State để quản lý việc hiển thị form thêm chương
  const [showAddChapterForm, setShowAddChapterForm] = useState(false);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles([...files, ...selectedFiles]);
  };

  const handleUrlUpload = () => {
    if (fileUrl) {
      setFiles([...files, { name: fileUrl, isUrl: true }]);
      setFileUrl("");
    }
  };

  // Hàm này sẽ nhận dữ liệu chương từ AddChapter
  const handleAddChapter = (newChapter) => {
    setChapters([...chapters, newChapter]);
    setShowAddChapterForm(false); // Đóng form sau khi thêm chương
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="h2">Thêm khóa học</h2>
      </div>
      <div className="form-row">
        <div className="upload-box">
          <div className="upload-header">
            <h3>Ảnh khóa học</h3>
            <p>Add your documents here, and you can upload up to 5 files max</p>
          </div>

          <div className="drop-zone">
            <input
              type="file"
              id="fileInput"
              className="file-input"
              multiple
              onChange={handleFileChange}
            />
            <label htmlFor="fileInput" className="drop-label">
              <span className="cloud-icon">☁</span>
              {files.length > 0 && (
                <span className="file-chip">{files[0].name}</span>
              )}
              Drag your file(s) or <span className="browse">browse</span>
              <p className="file-info">Max 10 MB files are allowed</p>
            </label>
          </div>

          <div className="file-type-note">
            Only support .jpg, .png and .svg and zip files
          </div>

          <div className="separator">OR</div>

          <div className="url-upload-section">
            <input
              type="text"
              className="url-input"
              placeholder="Add file URL"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
            <button className="upload-btn" onClick={handleUrlUpload}>
              Chọn ảnh
            </button>
          </div>
        </div>

        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="courseName">Tên khóa học</label>
            <input
              id="courseName"
              type="text"
              className="input"
              placeholder="Nhập tên khóa học"
            />
          </div>

          <div className="form-group">
            <label htmlFor="courseDesc">Mô tả khóa học</label>
            <input
              id="courseDesc"
              type="text"
              className="input"
              placeholder="Nhập mô tả khóa học"
            />
          </div>

          <div className="form-group">
            <label htmlFor="courseType">Loại khóa học</label>
            <select id="courseType" className="input">
              <option value="TOEIC">TOEIC</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEFL">TOEFL</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="coursePrice">Giá khóa học</label>
            <input
              id="coursePrice"
              type="text"
              className="input"
              placeholder="Nhập giá khóa học"
            />
          </div>
        </div>
      </div>

      {/* Nút Thêm chương sẽ hiển thị/ẩn AddChapter component */}
      <div className="chapter-section">
        <button className="add-chapter" onClick={() => setShowAddChapterForm(true)}>
          + Thêm chương
        </button>
      </div>

      {/* Hiển thị danh sách chương đã thêm */}
      {chapters.length > 0 && (
        <div className="chapter-list-container"> {/* Class mới cho danh sách chương */}
          <h4>Danh sách chương:</h4>
          {chapters.map((chapter, index) => (
            <div key={index} className="chapter-item-display"> {/* Class mới cho từng chương */}
              <span className="chapter-title">Chương {index + 1}: {chapter.name}</span> {/* Hiển thị tên chương */}
              <div className="chapter-actions">
                <button
                  className="icon-btn edit-icon"
                  onClick={() => console.log("Sửa chương:", index)}
                  title="Sửa chương"
                >
                  ✏️
                </button>
                <button
                  className="icon-btn delete-icon"
                  onClick={() => {
                    const updatedChapters = chapters.filter((_, i) => i !== index);
                    setChapters(updatedChapters);
                  }}
                  title="Xóa chương"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="action-buttons">
        <button className="create-btn">Tạo</button>
        <button className="back-btn" onClick={() => navigateTo(-1)}>
          Trở lại
        </button>
      </div>

      {/* Hiển thị AddChapter như một modal/component con */}
      {showAddChapterForm && (
        <div className="modal-overlay"> {/* Dùng để làm mờ nền */}
          <div className="modal-content">
            <AddChapter
              onClose={() => setShowAddChapterForm(false)} // Callback để đóng form
              onSaveChapter={handleAddChapter} // Callback để lưu chương
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AddCourse;