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

    // DÒNG DEBUG: In ra giá trị của courseId và chapterId từ URL params
    console.log("DEBUG: courseId from URL params:", courseId);
    console.log("DEBUG: chapterId from URL params:", chapterId);

    const [chapterName, setChapterName] = useState(''); 
    const [description, setDescription] = useState(''); 
    const [order, setOrder] = useState(''); // Mặc định là chuỗi rỗng để form hiển thị placeholder
    const [videoUrl, setVideoUrl] = useState(''); 
    const [fileUrl, setFileUrl] = useState(''); 

    const [loading, setLoading] = useState(false); 
    const [isEditMode, setIsEditMode] = useState(false); 

    const [showExerciseForm, setShowExerciseForm] = useState(false);
    const [exercises, setExercises] = useState([]); 
    const [editingExercise, setEditingExercise] = useState(null); 

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

    const handleEditExercise = (quizToEdit) => {
        setEditingExercise(quizToEdit); 
        setShowExerciseForm(true); 
    };

    const handleDeleteExercise = async (quizId, quizTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${quizTitle}"?`)) {
            return; 
        }
        setLoading(true); 
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }

            // Đảm bảo chapterId có giá trị khi xóa quiz
            if (!chapterId || chapterId === 'new') {
                toast.error("Không thể xóa bài tập: Chương chưa được lưu.");
                setLoading(false);
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
    };

    useEffect(() => {
        // DEBUG: Log khi useEffect được kích hoạt
        console.log("DEBUG useEffect triggered.");

        if (contextLoading) {
            console.log("DEBUG: Context still loading, returning.");
            return; 
        }
        if (!isAuthenticated) {
            console.log("DEBUG: Not authenticated, navigating to /login.");
            toast.error("Bạn cần đăng nhập để truy cập trang này.");
            navigate("/login");
            return;
        } else if (user && user.role !== "admin") {
            console.log("DEBUG: Not an admin, navigating to /.");
            toast.error("Bạn không có quyền truy cập trang này.");
            navigate("/");
            return;
        }

        // Kiểm tra courseId trước khi xử lý chapterId
        if (!courseId) {
            console.log("DEBUG: courseId is missing in URL, navigating to /admin/course."); // Sửa courses thành course
            toast.error("Không tìm thấy ID khóa học trong URL. Vui lòng quay lại trang quản lý khóa học.");
            navigate(`/admin/course`); // Sửa courses thành course
            return;
        }

        const fetchChapterDetails = async () => {
            setLoading(true); 
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                    navigate("/login");
                    return;
                }

                // API call để lấy chi tiết chương
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
                setDescription(chapterData.description || ''); 
                setVideoUrl(chapterData.videoUrl || ''); 
                setFileUrl(chapterData.fileUrl || ''); 

                // API call để lấy quizzes
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
                navigate(`/admin/courses/edit/${courseId}`); // Sửa courses thành course
            } finally {
                setLoading(false); 
            }
        };

        // ĐÂY LÀ LOGIC ĐƯỢC CẢI THIỆN:
        // Nếu chapterId tồn tại VÀ KHÔNG PHẢI 'new' -> chế độ chỉnh sửa
        if (chapterId && chapterId !== 'new') { 
            console.log("DEBUG: Entering edit mode for chapter:", chapterId);
            setIsEditMode(true);
            fetchChapterDetails(); 
        } else { // chapterId là 'new' HOẶC undefined/null/empty string
            console.log("DEBUG: Entering new chapter creation mode. chapterId was:", chapterId);
            setIsEditMode(false);
            // Reset tất cả các state về giá trị ban đầu cho form tạo mới
            setChapterName('');
            setDescription(''); 
            setOrder(1); // Mặc định thứ tự là 1 cho chương mới
            setVideoUrl(''); 
            setFileUrl(''); 
            setExercises([]); 
            setEditingExercise(null);
            setLoading(false); // Không có API call ban đầu khi tạo mới
        }

    }, [courseId, chapterId, isAuthenticated, user, contextLoading, navigate]); 

    const handleSubmitChapter = async (e) => {
        e.preventDefault(); 
        setLoading(true); 

        if (!chapterName.trim()) {
            toast.error("Vui lòng nhập tiêu đề chương.");
            setLoading(false);
            return;
        }
        if (chapterName.trim().length < 3 || chapterName.trim().length > 50) { 
            toast.error("Tiêu đề chương phải từ 3-50 ký tự.");
            setLoading(false);
            return;
        }
        // Order có thể là 0 nếu người dùng xóa input, đảm bảo là số hợp lệ
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

        const chapterData = {
            title: chapterName.trim(),
            order: parseInt(order),
            // Các trường này chỉ được lưu nếu Chapter Schema ở backend có chúng.
            // Nếu không, chúng sẽ bị bỏ qua bởi Mongoose hoặc gây lỗi validation.
            description: description.trim(), 
            videoUrl: videoUrl.trim(),      
            fileUrl: fileUrl.trim(),        
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
                navigate(`/admin/courses/edit/${courseId}`, { state: { chapterModified: true } }); // Sửa courses thành course
            } else {
                res = await axios.post(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters/new`, 
                    chapterData,
                    {
                        headers: { "Authorization": `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
                toast.success(res.data.message || "Thêm chương mới thành công!");
                navigate(`/admin/courses/edit/${courseId}`, { state: { chapterModified: true } }); // Sửa courses thành course
            }
        } catch (error) {
            console.error("Lỗi khi gửi form chương:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Thao tác thất bại.");
        } finally {
            setLoading(false); 
        }
    };

    const handleCloseExerciseForm = () => {
        setShowExerciseForm(false);
        setEditingExercise(null);
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

    if (loading && isEditMode && chapterId && chapterId !== 'new' && !chapterName) {
        return (
            <div className="dashboard-container">
                <p>Đang tải thông tin chương...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="h2">{isEditMode ? 'Chỉnh sửa chương' : 'Thêm chương mới'}</h2>
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
                        <h3>Thêm video bài học và tài liệu</h3>
                        <p>Bạn có thể upload file hoặc nhập URL video/file bài tập. (LƯU Ý: Cần cập nhật backend schema để lưu các trường này)</p>
                    </div>
                    <div className="url-upload-section">
                        <input
                            type="text"
                            className="url-input"
                            placeholder="Nhập URL Video bài học (Youtube, Vimeo...)"
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
                    
                    <div className="drop-zone">
                         <input
                            type="file"
                            id="fileInput"
                            className="file-input"
                            onChange={(e) => toast.info("Tính năng upload file trực tiếp đang được phát triển, vui lòng dùng URL hoặc quản lý qua backend.")}
                            disabled={loading}
                        />
                        <label htmlFor="fileInput" className="drop-label">
                            <span className="cloud-icon">☁</span>
                            <p>Kéo thả file hoặc <span className="browse">duyệt qua</span></p>
                            <p className="file-info">Hỗ trợ các định dạng video/tài liệu (Cần Backend API)</p>
                        </label>
                    </div>
                     <div className="file-type-note">
                        Chỉ hỗ trợ .mp4, .mov, .pdf, .docx, .zip (cần điều chỉnh theo backend và logic upload)
                    </div>
                </div>

                {chapterId && chapterId !== 'new' && ( 
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
                        onClick={() => navigate(`/admin/courses/edit/${courseId}`)} // Sửa courses thành course
                        disabled={loading}
                    >
                        Trở lại khóa học
                    </button>
                </div>
            </form>

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
