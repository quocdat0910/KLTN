import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../Component.css";
import { Link, useNavigate, useParams } from "react-router-dom";
// import AddChapter from "./AddChapter"; // Loại bỏ import này
import { Context } from '../../main';

function AddCourse() {
    const navigate = useNavigate();
    const { id: courseId } = useParams(); // 'id' ở đây có thể là courseId nếu route là /admin/course/:id
    const { isAuthenticated, user, loading: contextLoading } = useContext(Context);

    useEffect(() => {
        if (contextLoading) {
            return;
        }
        if (!isAuthenticated) {
            toast.error("Bạn cần đăng nhập để truy cập trang này.");
            navigate("/login");
        } else if (user && user.role !== "admin") {
            toast.error("Bạn không có quyền truy cập trang này.");
            navigate("/");
        }
    }, [isAuthenticated, user, contextLoading, navigate]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState('TOEIC');
    const [level, setLevel] = useState('Beginner');
    const [language, setLanguage] = useState('English');

    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const [loading, setLoading] = useState(false);
    const [courseCreatedId, setCourseCreatedId] = useState(null);
    const [courseCreatedName, setCourseCreatedName] = useState('');

    const [chapters, setChapters] = useState([]); // Vẫn giữ để hiển thị danh sách chương
    // const [showAddChapterForm, setShowAddChapterForm] = useState(false); // Loại bỏ
    // const [chapterToEdit, setChapterToEdit] = useState(null); // Loại bỏ

    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const fetchCourseAndChapterDetails = async () => {
            if (courseId) {
                setIsEditMode(true);
                setLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                        navigate("/login");
                        return;
                    }

                    // --- Request 1: Lấy thông tin chi tiết khóa học ---
                    const courseRes = await axios.get(`http://localhost:4000/api/v1/courses/${courseId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                    });
                    const courseData = courseRes.data.course;

                    setTitle(courseData.title || '');
                    setDescription(courseData.description || '');
                    setPrice(courseData.price || '');
                    setType(courseData.type || 'TOEIC');
                    setLevel(courseData.level || 'Beginner');
                    setLanguage(courseData.language || 'English');
                    setThumbnailPreview(courseData.thumbnail?.url || null);
                    setCourseCreatedId(courseData._id);
                    setCourseCreatedName(courseData.title);

                    // --- Request 2: Lấy danh sách chương cho khóa học này ---
                    // Vẫn giữ request này để hiển thị danh sách các chương hiện có trong khóa học
                    const chaptersRes = await axios.get(`http://localhost:4000/api/v1/courses/${courseId}/chapters`, {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                    });
                    if (Array.isArray(chaptersRes.data.chapters)) {
                        setChapters(chaptersRes.data.chapters);
                    } else {
                        setChapters([]);
                    }

                } catch (error) {
                    console.error("Lỗi khi tải thông tin khóa học hoặc chương:", error.response?.data?.message || error.message);
                    toast.error("Không thể tải thông tin khóa học hoặc chương: " + (error.response?.data?.message || error.message));
                    navigate("/admin/course");
                } finally {
                    setLoading(false);
                }
            } else {
                setIsEditMode(false);
                setTitle('');
                setDescription('');
                setPrice('');
                setType('TOEIC');
                setLevel('Beginner');
                setLanguage('English');
                setThumbnail(null);
                setThumbnailPreview(null);
                setCourseCreatedId(null);
                setCourseCreatedName('');
                setChapters([]);
                // setShowAddChapterForm(false); // Loại bỏ
                // setChapterToEdit(null); // Loại bỏ
            }
        };

        if (!contextLoading && isAuthenticated && user && user.role === "admin") {
            fetchCourseAndChapterDetails();
        }

    }, [courseId, isAuthenticated, user, contextLoading, navigate]);

    const handleThumbnailFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith("image")) {
                toast.error("Thumbnail phải là file ảnh.");
                setThumbnail(null);
                setThumbnailPreview(null);
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Thumbnail không được lớn hơn 2MB.");
                setThumbnail(null);
                setThumbnailPreview(null);
                return;
            }
            setThumbnail(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setThumbnail(null);
            if (!isEditMode) {
                setThumbnailPreview(null);
            }
        }
    };

    // Hàm này sẽ không được gọi nữa nếu AddChapter là một trang riêng
    // const handleChapterSave = (savedChapter) => {
    //     if (chapterToEdit) {
    //         setChapters(prevChapters =>
    //             prevChapters.map(chap =>
    //                 chap._id === savedChapter._id ? savedChapter : chap
    //             )
    //         );
    //         toast.success("Cập nhật chương thành công!");
    //     } else {
    //         setChapters(prevChapters => [...prevChapters, savedChapter]);
    //         toast.success("Thêm chương mới thành công!");
    //     }
    //     setShowAddChapterForm(false);
    //     setChapterToEdit(null);
    // };

    const handleEditChapter = (chapter) => {
        // Điều hướng đến trang chỉnh sửa chương với courseId và chapterId
        navigate(`/admin/course/${courseCreatedId}/chapters/${chapter._id}`);
    };

    const handleAddChapterClick = () => {
        if (courseCreatedId) {
            navigate(`/admin/course/${courseCreatedId}/chapters/new`);
        } else {
            toast.error("Vui lòng tạo hoặc chọn một khóa học trước khi thêm chương.");
        }
    };

     const handleDeleteChapter = async (chapIdToDelete, chapterTitle) => { // Đổi tên biến để tránh nhầm lẫn với chapterId từ useParams
        if (window.confirm(`Bạn có chắc chắn muốn xóa chương "${chapterTitle}"?`)) {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                    navigate("/login");
                    return;
                }

                // *** ĐIỀU CHỈNH URL TẠI ĐÂY ***
                // Sử dụng cả courseId và chapIdToDelete
                const res = await axios.delete(`http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapIdToDelete}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                toast.success(res.data.message || "Xóa chương thành công!");
                // Nếu hàm này nằm trong AddChapter, bạn có thể cần điều hướng về trang CourseEdit sau khi xóa
                // Hoặc nếu nó nằm trong CourseEdit, bạn sẽ cập nhật danh sách chương ở đó.
                // setChapters(prevChapters => prevChapters.filter(chap => chap._id !== chapIdToDelete));
                navigate(`/admin/course/edit/${courseId}`); // Ví dụ: sau khi xóa, quay lại trang chỉnh sửa khóa học
            } catch (error) {
                console.error("Lỗi khi xóa chương:", error.response?.data?.message || error.message);
                toast.error("Không thể xóa chương: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmitCourse = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!title || !description || price === '' || !type) {
            toast.error("Vui lòng cung cấp đầy đủ thông tin.");
            setLoading(false);
            return;
        }
        if (!isEditMode && !thumbnail) {
            toast.error("Vui lòng chọn ảnh thumbnail cho khóa học.");
            setLoading(false);
            return;
        }
        if (title.length < 5 || title.length > 100) {
            toast.error("Tiêu đề phải từ 5-100 ký tự.");
            setLoading(false);
            return;
        }
        if (!["TOEIC", "IELTS"].includes(type)) {
            toast.error("Loại khóa học không hợp lệ. Chỉ chấp nhận TOEIC hoặc IELTS.");
            setLoading(false);
            return;
        }
        if (parseFloat(price) < 0) {
            toast.error("Giá khóa học không thể âm.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('price', parseFloat(price));
        formData.append('type', type);
        formData.append('level', level);
        formData.append('language', language);
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                setLoading(false);
                navigate("/login");
                return;
            }

            let res;
            if (isEditMode) {
                res = await axios.put(`http://localhost:4000/api/v1/courses/${courseId}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${token}`
                    },
                    withCredentials: true,
                });
                toast.success(res.data.message || "Cập nhật khóa học thành công!");
                setCourseCreatedName(title);
            } else {
                res = await axios.post(
                    "http://localhost:4000/api/v1/courses",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            "Authorization": `Bearer ${token}`
                        },
                        withCredentials: true,
                    }
                );
                toast.success(res.data.message || "Tạo khóa học thành công! Bây giờ bạn có thể thêm chương.");
                setCourseCreatedId(res.data.course._id);
                setCourseCreatedName(res.data.course.title);
                // Sau khi tạo khóa học, điều hướng đến trang chỉnh sửa khóa học để có courseId trên URL
                navigate(`/admin/course/edit/${res.data.course._id}`);
            }

        } catch (error) {
            console.error("Lỗi khi gửi form khóa học:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Thao tác thất bại.");
        } finally {
            setLoading(false);
        }
    };

    if (contextLoading) {
        return (
            <div className="dashboard-container">
                <p>Đang kiểm tra quyền truy cập...</p>
            </div>
        );
    }
    if (!isAuthenticated || (user && user.role !== "admin")) {
        return null;
    }

    if (loading && isEditMode && !title) {
        return (
            <div className="dashboard-container">
                <p>Đang tải thông tin khóa học và chương...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="h2">{isEditMode ? 'Chỉnh sửa khóa học' : 'Thêm khóa học'}</h2>
            </div>
            <form onSubmit={handleSubmitCourse}>
                <div className="form-row">
                    <div className="upload-box">
                        <div className="upload-header">
                            <h3>Ảnh khóa học</h3>
                            <p>Thêm ảnh bìa cho khóa học của bạn (tối đa 2MB, chỉ .jpg, .png, .svg)</p>
                        </div>

                        <div className="drop-zone">
                            <input
                                type="file"
                                id="fileInput"
                                className="file-input"
                                accept="image/jpeg,image/png,image/svg+xml"
                                onChange={handleThumbnailFileChange}
                                disabled={loading}
                                required={!isEditMode && !thumbnailPreview}
                            />
                            <label htmlFor="fileInput" className="drop-label">
                                <span className="cloud-icon">☁</span>
                                {thumbnailPreview ? (
                                    <img src={thumbnailPreview} alt="Thumbnail Preview" className="thumbnail-preview-large" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', marginBottom: '10px' }} />
                                ) : thumbnail ? (
                                    <span className="file-chip">{thumbnail.name}</span>
                                ) : (
                                    <>
                                        Kéo thả file(s) hoặc <span className="browse">duyệt</span>
                                    </>
                                )}
                                <p className="file-info">Tối đa 2MB files được cho phép</p>
                            </label>
                        </div>

                        <div className="file-type-note">
                            Chỉ hỗ trợ .jpg, .png và .svg
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
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="courseDesc">Mô tả khóa học</label>
                            <input
                                id="courseDesc"
                                className="input"
                                placeholder="Nhập mô tả khóa học"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows="5"
                                disabled={loading}
                            ></input>
                        </div>

                        <div className="form-group">
                            <label htmlFor="courseType">Loại khóa học</label>
                            <select
                                id="courseType"
                                className="input"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                required
                                disabled={loading}
                            >
                                <option value="TOEIC">TOEIC</option>
                                <option value="IELTS">IELTS</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="courseLevel">Cấp độ</label>
                            <select
                                id="courseLevel"
                                className="input"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                disabled={loading}
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="courseLanguage">Ngôn ngữ</label>
                            <select
                                id="courseLanguage"
                                className="input"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                disabled={loading}
                            >
                                <option value="English">English</option>
                                <option value="Vietnamese">Vietnamese</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="coursePrice">Giá khóa học</label>
                            <input
                                id="coursePrice"
                                type="number"
                                className="input"
                                placeholder="Nhập giá khóa học"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                min="0"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                <div className="action-buttons">
                    <button
                        type="submit"
                        className="create-btn"
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật khóa học' : 'Tạo Khóa học'}
                    </button>
                    <button
                        type="button"
                        className="back-btn"
                        onClick={() => navigate("/admin/course")}
                        disabled={loading}
                    >
                        Trở lại
                    </button>
                </div>
            </form>

            {/* --- PHẦN QUẢN LÝ CHƯƠNG (Chỉ hiển thị khi đã có courseId) --- */}
            {courseCreatedId && (
                <>
                    <div className="chapter-section">
                        <h3>Quản lý Chương cho khóa học: {courseCreatedName}</h3>
                        <button
                            type="button"
                            className="create-btn3"
                            onClick={handleAddChapterClick} // Gọi hàm điều hướng
                            disabled={loading}
                        >
                            + Thêm chương mới
                        </button>
                    </div>

                    {/* --- Hiển thị danh sách chương đã thêm/tải --- */}
                    {chapters.length > 0 ? (
                        <div className="chapter-list-container">
                            <h4>Danh sách chương:</h4>
                            <ul className="chapter-items-list">
                                {chapters
                                    .sort((a, b) => a.order - b.order)
                                    .map((chapter) => (
                                        <li key={chapter._id} className="chapter-item-display">
                                            <div className="chapter-info">
                                                <span className="chapter-order">Chương {chapter.order}:</span>
                                                <span className="chapter-order">{chapter.title}</span>
                                            </div>
                                            <div className="chapter-actions">
                                                <button
                                                    type="button"
                                                    className="icon-btn edit-icon"
                                                    onClick={() => handleEditChapter(chapter)} // Gọi hàm điều hướng
                                                    title="Sửa chương"
                                                    disabled={loading}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    type="button"
                                                    className="icon-btn delete-icon"
                                                    onClick={() => handleDeleteChapter(chapter._id, chapter.title)}
                                                    title="Xóa chương"
                                                    disabled={loading}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="no-chapters-message">Chưa có chương nào cho khóa học này.</p>
                    )}
                </>
            )}
        </div>
    );
}

export default AddCourse;