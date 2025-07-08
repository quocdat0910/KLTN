// src/components/CreateLessonForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
// import { Context } from '../../main'; // Đảm bảo đường dẫn đúng

function CreateLessonForm({ onClose, courseId, chapterId, suggestedOrder, onLessonCreated, editingLesson }) {
    // const { isAuthenticated, user } = useContext(Context);
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoDuration, setVideoDuration] = useState('');
    const [order, setOrder] = useState(suggestedOrder || '');
    const [transcript, setTranscript] = useState('');
    const [resources, setResources] = useState([]); // Mảng các resource
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(false);

    // Effect để tải dữ liệu khi ở chế độ chỉnh sửa bài học
    useEffect(() => {
        if (editingLesson) {
            setTitle(editingLesson.title || '');
            setVideoUrl(editingLesson.videoUrl || '');
            setVideoDuration(editingLesson.videoDuration || '');
            setOrder(editingLesson.order || '');
            setTranscript(editingLesson.transcript || '');
            setResources(Array.isArray(editingLesson.resources) ? editingLesson.resources : []);
            setIsPublished(editingLesson.isPublished !== undefined ? editingLesson.isPublished : false);
        } else {
            // Reset form khi tạo mới
            setTitle('');
            setVideoUrl('');
            setVideoDuration('');
            setOrder(suggestedOrder || '');
            setTranscript('');
            setResources([]);
            setIsPublished(false);
        }
    }, [editingLesson, suggestedOrder]);

    // Xử lý thay đổi resource (tên, url, type)
    const handleResourceChange = (index, field, value) => {
        const newResources = [...resources];
        newResources[index][field] = value;
        setResources(newResources);
    };

    // Thêm resource mới
    const handleAddResource = () => {
        setResources([...resources, { name: '', url: '', type: 'link' }]);
    };

    // Xóa resource
    const handleRemoveResource = (index) => {
        setResources(resources.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Frontend Validation (đảm bảo khớp với backend controller)
        if (!title || title.length < 3 || title.length > 100) {
            toast.error("Tiêu đề bài học phải từ 3 đến 100 ký tự.");
            setLoading(false); return;
        }
        if (!videoUrl || !/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(videoUrl)) { // Basic URL regex
            toast.error("URL video không hợp lệ.");
            setLoading(false); return;
        }
        if (!videoDuration || isNaN(Number(videoDuration)) || Number(videoDuration) < 0) {
            toast.error("Thời lượng video phải là số không âm.");
            setLoading(false); return;
        }
        const parsedOrder = parseInt(order);
        if (isNaN(parsedOrder) || parsedOrder < 1) {
            toast.error("Thứ tự bài học phải là số nguyên lớn hơn hoặc bằng 1.");
            setLoading(false); return;
        }
        if (transcript && transcript.length < 1) {
            toast.error("Bản ghi không được để trống nếu có.");
            setLoading(false); return;
        }
        for (const res of resources) {
            if (!res.name || res.name.length < 1 || res.name.length > 100) {
                toast.error("Tên tài liệu phải từ 1 đến 100 ký tự.");
                setLoading(false); return;
            }
            if (!res.url || !/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(res.url)) {
                toast.error("URL tài liệu không hợp lệ.");
                setLoading(false); return;
            }
            if (!["pdf", "doc", "link", "image"].includes(res.type)) {
                toast.error("Loại tài liệu không hợp lệ.");
                setLoading(false); return;
            }
        }


        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                // navigate("/login"); // Không navigate trong modal
                return;
            }

            const lessonData = {
                title,
                videoUrl,
                videoDuration: Number(videoDuration),
                order: parsedOrder,
                transcript: transcript || null,
                resources: resources,
                isPublished,
            };

            let res;
            if (editingLesson) {
                // Cập nhật bài học
                res = await axios.put(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/lessons/${editingLesson._id}`,
                    lessonData,
                    {
                        headers: { "Authorization": `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
            } else {
                // Tạo bài học mới
                res = await axios.post(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/lessons`,
                    lessonData,
                    {
                        headers: { "Authorization": `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
            }
            onLessonCreated(res.data.lesson); // Gọi callback để cập nhật danh sách bài học ở AddChapter
            toast.success(res.data.message);

        } catch (error) {
            console.error("Lỗi khi gửi form bài học:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Thao tác thất bại.");
        } finally {
            setLoading(false);
        }
    };

    // if (!isAuthenticated || (user && user.role !== "admin")) {
    //     return null; // Hoặc hiển thị thông báo lỗi quyền
    // }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="lessonTitle">Tiêu đề bài học</label>
                        <input
                            id="lessonTitle"
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="videoUrl">URL Video</label>
                        <input
                            id="videoUrl"
                            type="url"
                            className="input"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="videoDuration">Thời lượng Video (phút)</label>
                        <input
                            id="videoDuration"
                            type="number"
                            className="input"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value)}
                            required
                            min="0"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lessonOrder">Thứ tự bài học</label>
                        <input
                            id="lessonOrder"
                            type="number"
                            className="input"
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            required
                            min="1"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="transcript">Bản ghi (tùy chọn)</label>
                        <input
                            id="transcript"
                            className="input"
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            rows="5"
                            placeholder="Nhập bản ghi bài học..."
                            disabled={loading}
                        ></input>
                    </div>

                    {/* Resources Section */}
                    <div className="resources-section mt-4">
                        <h3>Tài liệu đính kèm</h3>
                        {resources.map((resource, index) => (
                            <div key={index} className="resource-item p-3 mb-3 border rounded">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>Tài liệu {index + 1}</h5>
                                    <button
                                        type="button"
                                        className="back-btn"
                                        onClick={() => handleRemoveResource(index)}
                                        disabled={loading}
                                    >
                                        Hủy
                                    </button>
                                </div>
                                <div className="form-group">
                                    <label>Tên tài liệu</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={resource.name}
                                        onChange={(e) => handleResourceChange(index, 'name', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>URL Tài liệu</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={resource.url}
                                        onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Loại tài liệu</label>
                                    <select
                                        className="form-control"
                                        value={resource.type}
                                        onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="link">Link</option>
                                        <option value="pdf">PDF</option>
                                        <option value="doc">DOC</option>
                                        <option value="image">Image</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="create-btn"
                            onClick={handleAddResource}
                            disabled={loading}
                        >
                            Thêm tài liệu
                        </button>
                    </div>

                    <div className="chapter-form-group">
                        <label htmlFor="isPublishedLesson" className="chapter-toggle-label">
                            <input
                                type="checkbox"
                                id="isPublishedLesson"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                disabled={loading}
                            />
                            <span className="chapter-toggle-slider"></span>
                            Xuất bản bài học này?
                        </label>
                    </div>

                    <div className="action-buttons2">
                        <button type="submit" className="create-btn" disabled={loading}>
                            {loading ? 'Đang xử lý...' : (editingLesson ? 'Cập nhật bài học' : 'Tạo bài học')}
                        </button>
                        <button type="button" className="back-btn" onClick={onClose} disabled={loading}>
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateLessonForm;