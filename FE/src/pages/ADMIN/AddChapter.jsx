import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { Context } from '../../main';
import CreateExerciseForm from "../../components/CreateExerciseForm";
import "../../Component.css";

function AddChapter() {
    const navigate = useNavigate();
    const { courseId, chapterId } = useParams();
    const { isAuthenticated, user, loading: contextLoading } = useContext(Context);

    const [chapterName, setChapterName] = useState(''); // Ánh xạ với 'title' trong ChapterSchema
    const [description, setDescription] = useState(''); // KHÔNG CÓ TRONG ChapterSchema của bạn
    const [order, setOrder] = useState('');           // CÓ TRONG ChapterSchema
    const [videoUrl, setVideoUrl] = useState('');     // KHÔNG CÓ TRONG ChapterSchema của bạn
    const [fileUrl, setFileUrl] = useState('');       // KHÔNG CÓ TRONG ChapterSchema của bạn

    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [showExerciseForm, setShowExerciseForm] = useState(false);
    const [exercises, setExercises] = useState([]); // Danh sách bài tập (quizzes)
    const [editingExercise, setEditingExercise] = useState(null);

    // --- HÀM XỬ LÝ KHI BÀI TẬP ĐƯỢC TẠO/CẬP NHẬT THÀNH CÔNG ---
    const handleQuizCreated = (newQuiz) => {
        setExercises(prevExercises => {
            if (editingExercise) {
                return prevExercises.map(quiz =>
                    quiz._id === newQuiz._id ? newQuiz : quiz
                );
            } else {
                return [...prevExercises, newQuiz];
            }
        });
        setShowExerciseForm(false);
        setEditingExercise(null);
        toast.success("Bài tập đã được " + (editingExercise ? "cập nhật" : "thêm") + " vào danh sách chương!");
    };

    // --- CHỨC NĂNG CHỈNH SỬA BÀI TẬP ---
    const handleEditExercise = (quizToEdit) => {
        setEditingExercise(quizToEdit);
        setShowExerciseForm(true);
    };

    // --- HÀM XỬ LÝ XÓA BÀI TẬP ---
    const handleDeleteExercise = async (quizId, quizTitle) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${quizTitle}"?`)) {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                    navigate("/login");
                    return;
                }

                await axios.delete(`http://localhost:4000/api/v1/chapters/${chapterId}/quizzes/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                setExercises(prevExercises => prevExercises.filter(quiz => quiz._id !== quizId));
                toast.success("Xóa bài tập thành công!");
            } catch (error) {
                console.error("Lỗi khi xóa bài tập:", error.response?.data?.message || error.message);
                toast.error("Không thể xóa bài tập: " + (error.response?.data?.message || "Lỗi không xác định"));
            } finally {
                setLoading(false);
            }
        }
    };

    // --- LOGIC XÁC THỰC VÀ QUYỀN HẠN ---
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

    // --- LOGIC TẢI CHI TIẾT CHƯƠNG VÀ BÀI TẬP KHI Ở CHẾ ĐỘ CHỈNH SỬA ---
    useEffect(() => {
        const fetchChapterDetails = async () => {
            if (chapterId && chapterId !== 'new' && courseId) {
                setIsEditMode(true);
                setLoading(true);

                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                        navigate("/login");
                        return;
                    }

                    // 1. Lấy thông tin chi tiết chương
                    const chapterRes = await axios.get(
                        `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                            withCredentials: true,
                        }
                    );
                    const chapterData = chapterRes.data.chapter;
                    setChapterName(chapterData.title || '');
                    setOrder(chapterData.order || '');
                    // KHÔNG CÓ description, videoUrl, fileUrl TRONG ChapterSchema của bạn.
                    // Nếu bạn muốn lưu trữ chúng, bạn PHẢI THÊM vào ChapterSchema của backend.
                    // Hiện tại, chúng sẽ không được tải hoặc gửi lên server cho Chapter model.
                    setDescription(chapterData.description || ''); // Giữ để hiển thị UI, nhưng sẽ không lưu vào Chapter Model
                    setVideoUrl(chapterData.videoUrl || '');     // Giữ để hiển thị UI, nhưng sẽ không lưu vào Chapter Model
                    setFileUrl(chapterData.fileUrl || '');       // Giữ để hiển thị UI, nhưng sẽ không lưu vào Chapter Model


                    // 2. Lấy danh sách quizzes (bài tập) cho chương này
                    const quizzesRes = await axios.get(
                        `http://localhost:4000/api/v1/chapters/${chapterId}/quizzes`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                            withCredentials: true,
                        }
                    );
                    if (Array.isArray(quizzesRes.data.quizzes)) {
                        setExercises(quizzesRes.data.quizzes);
                    } else {
                        setExercises([]);
                    }

                } catch (error) {
                    console.error("Lỗi khi tải thông tin chương hoặc bài tập:", error.response?.data?.message || error.message);
                    toast.error("Không thể tải thông tin chương hoặc bài tập: " + (error.response?.data?.message || "Lỗi không xác định"));
                    navigate(`/admin/course/edit/${courseId}`);
                } finally {
                    setLoading(false);
                }
            } else if (chapterId === 'new' && courseId) {
                setIsEditMode(false);
                setChapterName('');
                setDescription(''); // Reset cho UI
                setOrder('');
                setVideoUrl('');     // Reset cho UI
                setFileUrl('');       // Reset cho UI
                setExercises([]);
                setEditingExercise(null);
            } else {
                toast.error("Không tìm thấy ID khóa học hoặc đường dẫn chương không hợp lệ.");
                navigate("/admin/course");
            }
        };

        if (isAuthenticated && user && user.role === "admin" && !contextLoading) {
            fetchChapterDetails();
        }
    }, [courseId, chapterId, isAuthenticated, user, contextLoading, navigate]);

    // --- HÀM XỬ LÝ GỬI FORM CHƯƠNG (Tạo/Cập nhật) ---
    const handleSubmitChapter = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!chapterName.trim()) {
            toast.error("Vui lòng nhập tiêu đề chương.");
            setLoading(false);
            return;
        }
        if (chapterName.trim().length < 3 || chapterName.trim().length > 50) { // Theo min/maxlength của ChapterSchema
            toast.error("Tiêu đề chương phải từ 3-50 ký tự.");
            setLoading(false);
            return;
        }
        if (isNaN(parseInt(order)) || parseInt(order) <= 0) {
            toast.error("Thứ tự chương phải là một số nguyên dương.");
            setLoading(false);
            return;
        }
        if (!courseId) {
            toast.error("Không tìm thấy ID khóa học. Vui lòng quay lại trang chỉnh sửa khóa học.");
            setLoading(false);
            return;
        }

        // CHỈ GỬI CÁC TRƯỜNG CÓ TRONG ChapterSchema CỦA BẠN
        const chapterData = {
            title: chapterName.trim(),
            order: parseInt(order),
            // description, videoUrl, fileUrl KHÔNG CÓ TRONG ChapterSchema.
            // Nếu muốn lưu, bạn phải thêm vào ChapterSchema ở backend.
            // Hiện tại, chúng sẽ không được gửi lên server cho Chapter model.
            // videoUrl: videoUrl.trim(), // Bỏ comment nếu thêm vào ChapterSchema
            // fileUrl: fileUrl.trim(),   // Bỏ comment nếu thêm vào ChapterSchema
            // description: description.trim(), // Bỏ comment nếu thêm vào ChapterSchema
        };

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
                res = await axios.put(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}`,
                    chapterData,
                    {
                        headers: { "Authorization": `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
                toast.success(res.data.message || "Cập nhật chương thành công!");
            } else {
                res = await axios.post(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters`, // Endpoint để tạo chương mới
                    chapterData,
                    {
                        headers: { "Authorization": `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
                toast.success(res.data.message || "Thêm chương mới thành công!");
                navigate(`/admin/course/${courseId}/chapter/${res.data.chapter._id}`);
            }
        } catch (error) {
            console.error("Lỗi khi gửi form chương:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Thao tác thất bại.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm đóng form bài tập, reset editingExercise
    const handleCloseExerciseForm = () => {
        setShowExerciseForm(false);
        setEditingExercise(null);
    };

    // --- RENDERING DỰA TRÊN TRẠNG THÁI ---
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

    if (loading && isEditMode && !chapterName) {
        return (
            <div className="dashboard-container">
                <p>Đang tải thông tin chương...</p>
            </div> // Đã xóa thẻ </p> thừa ở đây
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="h2">{isEditMode ? 'Chỉnh sửa chương' : 'Thêm chương mới'}</h2>
                <p>Khóa học hiện tại: {courseId ? `ID: ${courseId}` : 'Chưa chọn'}</p>
            </div>

            <form onSubmit={handleSubmitChapter}>
                <div className="form-fields">
                    <div className="form-group">
                        <label htmlFor="chapterName">Tiêu đề chương</label>
                        <input
                            id="chapterName"
                            type="text"
                            className="input"
                            placeholder="Nhập tiêu đề chương"
                            value={chapterName}
                            onChange={(e) => setChapterName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="chapterOrder">Thứ tự chương</label>
                        <input
                            id="chapterOrder"
                            type="number"
                            className="input"
                            placeholder="Thứ tự hiển thị"
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            required
                            min="1"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="upload-box">
                    <div className="upload-header">
                        <h3>Thêm video bài học và tài liệu (Không lưu vào Chapter Model với Schema hiện tại)</h3>
                        <p>Bạn có thể upload file hoặc nhập URL video/file bài tập</p>
                    </div>

                    <div className="drop-zone">
                        <input
                            type="file"
                            id="fileInput"
                            className="file-input"
                            onChange={(e) => toast.info("Tính năng upload file trực tiếp đang được phát triển, vui lòng dùng URL.")}
                            disabled={loading}
                        />
                        <label htmlFor="fileInput" className="drop-label">
                            <span className="cloud-icon">☁</span>
                            <p>Kéo thả file hoặc <span className="browse">duyệt qua</span></p>
                            <p className="file-info">Hỗ trợ các định dạng video/tài liệu</p>
                        </label>
                    </div>

                    <div className="file-type-note">
                        Chỉ hỗ trợ .mp4, .mov, .pdf, .docx, .zip (cần điều chỉnh theo backend)
                    </div>

                    <div className="separator">HOẶC</div>

                    <div className="url-upload-section">
                        <input
                            type="text"
                            className="url-input"
                            placeholder="Nhập URL Video bài học"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            disabled={loading}
                        />
                        <input
                            type="text"
                            className="url-input mt-2"
                            placeholder="Nhập URL File bài tập (PDF, DOCX...)"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* --- THÊM BÀI TẬP (QUIZ) --- */}
                {(isEditMode || (chapterId && chapterId !== 'new')) && (
                    <div className="chapter-section">
                        <button
                            type="button"
                            className="create-btn2"
                            onClick={() => {
                                setEditingExercise(null);
                                setShowExerciseForm(true);
                            }}
                            disabled={loading}
                        >
                            + Thêm bài tập
                        </button>
                    </div>
                )}

                {/* --- HIỂN THỊ DANH SÁCH BÀI TẬP --- */}
                {exercises.length > 0 && (
                    <div className="ex-list-container">
                        <h4>Danh sách bài tập:</h4>
                        {exercises.map((ex, index) => (
                            <div key={ex._id || index} className="ex-item-display">
                                <span className="ex-title">Bài tập {ex.order || (index + 1)}: {ex.title}</span>
                                <div className="ex-actions">
                                    <button
                                        type="button"
                                        className="ex-icon-btn ex-edit-icon"
                                        onClick={() => handleEditExercise(ex)}
                                        title="Sửa bài tập"
                                        disabled={loading}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        className="ex-icon-btn ex-delete-icon"
                                        onClick={() => handleDeleteExercise(ex._id, ex.title)}
                                        title="Xóa bài tập"
                                        disabled={loading}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- NÚT HÀNH ĐỘNG CỦA FORM CHƯƠNG --- */}
                <div className="action-buttons">
                    <button
                        type="submit"
                        className="create-btn"
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật chương' : 'Tạo chương')}
                    </button>
                    <button
                        type="button"
                        className="back-btn"
                        onClick={() => navigate(`/admin/course/edit/${courseId}`)}
                        disabled={loading}
                    >
                        Trở lại khóa học
                    </button>
                </div>
            </form>

            {/* --- MODAL THÊM BÀI TẬP (CẬP NHẬT PROPS) --- */}
            {showExerciseForm && (
                <CreateExerciseForm
                    onClose={handleCloseExerciseForm}
                    chapterId={chapterId}
                    suggestedOrder={exercises.length + 1}
                    onQuizCreated={handleQuizCreated}
                    editingExercise={editingExercise}
                />
            )}
        </div>
    );
}

export default AddChapter;
