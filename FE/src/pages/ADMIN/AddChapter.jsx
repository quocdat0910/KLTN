import React, { useState } from "react";
import CreateExerciseForm from "../../components/CreateExerciseForm";
import "../../Component.css";
// import { Link, useNavigate } from "react-router-dom"; // Không cần useNavigate nữa nếu là modal

// Chuyển AddChapter nhận các props onClose và onSaveChapter
function AddChapter({ onClose, onSaveChapter }) {
  // const navigateTo = useNavigate(); // Bỏ useNavigate
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [exercises, setExercises] = useState([]);
  // State mới cho tên chương
  const [chapterName, setChapterName] = useState("");

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

  const handleCreateExercise = (newExercise) => {
    setExercises([...exercises, newExercise]);
    setShowExerciseForm(false);
  };

  const handleEditExercise = (index) => {
    console.log("Chỉnh sửa bài tập:", index);
  };

  const handleDeleteExercise = (index) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
    console.log("Xóa bài tập:", index);
  };

  // Hàm xử lý khi nhấn nút "Tạo/Lưu chương"
  const handleSaveChapter = () => {
    if (chapterName.trim() === "") {
      alert("Vui lòng nhập tên chương!");
      return;
    }
    // Gửi dữ liệu chương (tên, video, bài tập) về component cha
    const newChapterData = {
      name: chapterName,
      videoFiles: files, // Lưu trữ các file đã upload (nếu có)
      videoUrl: fileUrl, // Lưu trữ URL video (nếu có)
      exercises: exercises, // Lưu trữ danh sách bài tập đã tạo
    };
    onSaveChapter(newChapterData); // Gọi callback để lưu chương
  };


  return (
    // Thêm class để dễ dàng định dạng modal
    <div className="add-chapter-modal-content">
      <div className="dashboard-header">
        <h2 className="h2">Thêm chương</h2>
      </div>

      <div className="form-fields">
        <div className="form-group">
          <label htmlFor="chapterName">Tên chương</label>
          <input
            id="chapterName"
            type="text"
            className="input"
            placeholder="Nhập tên chương"
            value={chapterName} // Liên kết với state
            onChange={(e) => setChapterName(e.target.value)}
          />
        </div>
      </div>

      <div className="upload-box">
        <div className="upload-header">
          <h3>Thêm video bài học</h3>
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
            Upload
          </button>
        </div>
      </div>

      <div className="chapter-section">
        <button className="add-chapter" onClick={() => setShowExerciseForm(true)}>+ Thêm bài tập</button>
      </div>

      {exercises.length > 0 && (
        <div className="ex-list-container">
          <h4>Danh sách bài tập:</h4>
          {exercises.map((ex, index) => (
            <div key={index} className="ex-item-display">
              <span className="ex-title">Bài tập {index + 1}</span>
              <div className="ex-actions">
                <button
                  className="ex-icon-btn ex-edit-icon"
                  onClick={() => handleEditExercise(index)}
                  title="Sửa bài tập"
                >
                  ✏️
                </button>
                <button
                  className="ex-icon-btn ex-delete-icon"
                  onClick={() => handleDeleteExercise(index)}
                  title="Xóa bài tập"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="action-buttons">
        <button className="create-btn" onClick={handleSaveChapter}>Tạo chương</button> {/* Đổi tên nút và thêm onClick */}
        <button className="back-btn" onClick={onClose}> {/* Gọi onClose để đóng modal */}
          Trở lại
        </button>
      </div>

      {showExerciseForm && (
        <CreateExerciseForm
          onClose={() => setShowExerciseForm(false)}
          onCreate={handleCreateExercise}
        />
      )}
    </div>
  );
}

export default AddChapter;