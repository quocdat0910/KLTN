import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../Component.css";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Context } from '../../main';

function AddCourse() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: courseId } = useParams(); // Đổi tên biến này cho rõ ràng hơn khi dùng trong useEffect
    const { isAuthenticated, user, loading: contextLoading } = useContext(Context);

    // --- State cho thông tin khóa học ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [price, setPrice] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [discountExpiresAt, setDiscountExpiresAt] = useState('');
    const [type, setType] = useState('TOEIC');
    const [level, setLevel] = useState('Beginner');
    const [language, setLanguage] = useState('English');
    const [targetScoreRange, setTargetScoreRange] = useState('');
    const [skills, setSkills] = useState([]);
    const [objectives, setObjectives] = useState('');
    const [requirements, setRequirements] = useState('');
    const [tags, setTags] = useState('');
    const [status, setStatus] = useState('draft');

    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    // --- State chung ---
    const [loading, setLoading] = useState(false);
    // **Thay đổi:** courseCreatedId giờ sẽ được dùng để lưu ID của khóa học hiện tại (tạo mới hoặc đang chỉnh sửa)
    const [courseCreatedId, setCourseCreatedId] = useState(null);
    const [courseCreatedName, setCourseCreatedName] = useState('');
    const [chapters, setChapters] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- GUARD: Kiểm tra quyền admin sau khi Context đã tải xong ---
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

    // --- Hàm tải chương cho khóa học ---
    const fetchChaptersForCourse = async (id) => {
        if (!id) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }
            const chaptersRes = await axios.get(`http://localhost:4000/api/v1/courses/${id}/chapters`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            if (Array.isArray(chaptersRes.data.chapters)) {
                setChapters(chaptersRes.data.chapters);
            } else {
                setChapters([]);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách chương:", error.response?.data?.message || error.message);
            setChapters([]);
        }
    };

    // --- useEffect để tải thông tin khóa học và chương khi ở chế độ chỉnh sửa ---
    useEffect(() => {
        const fetchCourseAndChapterDetails = async () => {
            if (courseId) { // Nếu có courseId trên URL => Chế độ chỉnh sửa
                setIsEditMode(true);
                setLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                        navigate("/login");
                        return;
                    }

                    const courseRes = await axios.get(`http://localhost:4000/api/v1/courses/${courseId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                    });
                    const courseData = courseRes.data.course;

                    // --- CÁC DÒNG ĐƯỢC CHỈNH SỬA TẠI ĐÂY ---
                    setTitle(courseData.title || '');
                    setDescription(courseData.description || '');
                    setShortDescription(courseData.shortDescription || '');

                    // Đảm bảo giá trị không phải null/undefined trước khi gọi toString()
                    // Dùng `!= null` để bắt cả null và undefined
                    setPrice(courseData.price != null ? courseData.price.toString() : '');
                    setOriginalPrice(courseData.originalPrice != null ? courseData.originalPrice.toString() : '');
                    setDiscountPercentage(courseData.discountPercentage != null ? courseData.discountPercentage.toString() : '');

                    setDiscountExpiresAt(courseData.discountExpiresAt ? new Date(courseData.discountExpiresAt).toISOString().split('T')[0] : '');
                    setType(courseData.courseType || 'TOEIC');
                    setLevel(courseData.level || 'Beginner');
                    setLanguage(courseData.language || 'English');
                    setTargetScoreRange(courseData.targetScoreRange || '');
                    
                    // Đảm bảo là mảng trước khi gán
                    setSkills(Array.isArray(courseData.skills) ? courseData.skills : []);
                    // Sử dụng join chỉ khi nó là mảng và có phần tử
                    setObjectives(Array.isArray(courseData.objectives) ? courseData.objectives.join(', ') : '');
                    setRequirements(Array.isArray(courseData.requirements) ? courseData.requirements.join(', ') : '');
                    setTags(Array.isArray(courseData.tags) ? courseData.tags.join(', ') : '');
                    
                    setStatus(courseData.status || 'draft');

                    // Sử dụng optional chaining an toàn hơn cho thumbnail.url
                    setThumbnailPreview(courseData.thumbnail?.url || null);
                    // --- KẾT THÚC CHỈNH SỬA ---

                    setCourseCreatedId(courseData._id);
                    setCourseCreatedName(courseData.title);

                    await fetchChaptersForCourse(courseData._id);

                } catch (error) {
                    console.error("Lỗi khi tải thông tin khóa học hoặc chương:", error.response?.data?.message || error.message);
                    toast.error("Không thể tải thông tin khóa học hoặc chương: " + (error.response?.data?.message || error.message));
                    navigate("/admin/courses");
                } finally {
                    setLoading(false);
                }
            } else { // Chế độ thêm mới (không có courseId trên URL)
                setIsEditMode(false);
                // Reset states khi ở chế độ thêm mới
                setTitle('');
                setDescription('');
                setShortDescription('');
                setPrice('');
                setOriginalPrice('');
                setDiscountPercentage('');
                setDiscountExpiresAt('');
                setType('TOEIC');
                setLevel('Beginner');
                setLanguage('English');
                setTargetScoreRange('');
                setSkills([]);
                setObjectives('');
                setRequirements('');
                setTags('');
                setStatus('draft');

                setThumbnail(null);
                setThumbnailPreview(null);
                setCourseCreatedId(null); // Đảm bảo ID được reset
                setCourseCreatedName('');
                setChapters([]);
                setLoading(false); // Quan trọng: Đặt loading về false sau khi reset states
            }
        };

        if (!contextLoading && isAuthenticated && user && user.role === "admin") {
            fetchCourseAndChapterDetails();
        }

    }, [courseId, isAuthenticated, user, contextLoading, navigate]); // Phụ thuộc vào courseId (từ useParams)

    // --- useEffect để refetch chương khi có thay đổi từ trang khác (ví dụ: AddChapter) ---
    useEffect(() => {
        if (location.state?.chapterModified && courseCreatedId) {
            console.log("Detected chapter modified, refetching chapters...");
            fetchChaptersForCourse(courseCreatedId);
            // Xóa state để không kích hoạt lại việc refetch khi quay lại trang
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.chapterModified, courseCreatedId, navigate, location.pathname]);

    // --- Xử lý thay đổi file thumbnail ---
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
            if (!isEditMode) { // Chỉ xóa preview nếu không phải chế độ chỉnh sửa
                setThumbnailPreview(null);
            }
        }
    };

    // --- Xử lý chỉnh sửa chương ---
    const handleEditChapter = (chapter) => {
        // Đảm bảo courseCreatedId có giá trị trước khi điều hướng
        if (courseCreatedId) {
            navigate(`/admin/courses/${courseCreatedId}/chapters/${chapter._id}`);
        } else {
            toast.error("Không tìm thấy ID khóa học để chỉnh sửa chương.");
        }
    };

    // --- Xử lý thêm chương mới ---
    const handleAddChapterClick = () => {
        if (courseCreatedId) {
            navigate(`/admin/courses/${courseCreatedId}/chapters/new`);
        } else {
            toast.error("Vui lòng tạo hoặc chọn một khóa học trước khi thêm chương.");
        }
    };

    // --- Xử lý xóa chương ---
    const handleDeleteChapter = async (chapIdToDelete, chapterTitle) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa chương "${chapterTitle}"?`)) {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                    navigate("/login");
                    return;
                }

                const res = await axios.delete(`http://localhost:4000/api/v1/courses/${courseCreatedId}/chapters/${chapIdToDelete}`, { // Sử dụng courseCreatedId
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                toast.success(res.data.message || "Xóa chương thành công!");
                await fetchChaptersForCourse(courseCreatedId);

            } catch (error) {
                console.error("Lỗi khi xóa chương:", error.response?.data?.message || error.message);
                toast.error("Không thể xóa chương: " + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    // --- Xử lý form gửi khóa học (Tạo mới/Cập nhật) ---
    const handleSubmitCourse = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Frontend Validation
        if (!title || !description || !shortDescription || price === '' || !type || !targetScoreRange || !objectives) {
            toast.error("Vui lòng cung cấp đầy đủ thông tin bắt buộc (Tiêu đề, Mô tả, Mô tả ngắn, Giá, Loại, Dải điểm mục tiêu, Mục tiêu khóa học).");
            setLoading(false);
            return;
        }
        // Thumbnail check: required only if creating or editing and no existing preview (i.e., user wants to upload new one or it's a new course without one)
        if (!isEditMode && !thumbnail) { // If adding a new course AND no thumbnail selected
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
        if (originalPrice !== '' && parseFloat(originalPrice) < 0) {
            toast.error("Giá gốc khóa học không thể âm.");
            setLoading(false);
            return;
        }
        if (discountPercentage !== '' && (parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100)) {
            toast.error("Phần trăm giảm giá phải từ 0 đến 100.");
            setLoading(false);
            return;
        }

        const validScoreRanges =
            type === "IELTS"
                ? ["4.0-5.0", "5.0-6.0", "5.5-6.5", "6.0-7.0", "7.0-8.0", "8.0+"]
                : ["250-350", "350-450", "450-550", "550-650", "650-850", "850+"];
        if (!validScoreRanges.includes(targetScoreRange)) {
            toast.error("Dải điểm mục tiêu không hợp lệ với loại khóa học đã chọn.");
            setLoading(false);
            return;
        }

        const allowedSkills = ["Listening", "Speaking", "Reading", "Writing", "General"];
        if (skills.length > 0 && !skills.every(skill => allowedSkills.includes(skill.trim()))) {
            toast.error("Kỹ năng không hợp lệ. Chỉ chấp nhận Listening, Speaking, Reading, Writing, General.");
            setLoading(false);
            return;
        }

        if (language && !["English", "Vietnamese"].includes(language)) {
            toast.error("Ngôn ngữ không hợp lệ. Chỉ chấp nhận English hoặc Vietnamese.");
            setLoading(false);
            return;
        }
        if (!objectives || objectives.length === 0) {
            toast.error("Mục tiêu khóa học là bắt buộc.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('shortDescription', shortDescription);
        formData.append('price', parseFloat(price));
        if (originalPrice) formData.append('originalPrice', parseFloat(originalPrice));
        if (discountPercentage) formData.append('discountPercentage', parseFloat(discountPercentage));
        if (discountExpiresAt) formData.append('discountExpiresAt', discountExpiresAt);
        formData.append('courseType', type);
        formData.append('level', level);
        formData.append('language', language);
        formData.append('targetScoreRange', targetScoreRange);
        formData.append('skills', skills.join(',')); // Chắc chắn skills là mảng rồi mới join
        formData.append('objectives', objectives);
        formData.append('requirements', requirements);
        formData.append('tags', tags);
        formData.append('status', status);

     if (thumbnail) { // Chỉ append thumbnail nếu có file MỚI được chọn
            formData.append('thumbnail', thumbnail);
        } else if (isEditMode && thumbnailPreview) { // Nếu đang chỉnh sửa và KHÔNG có file mới nhưng CÓ preview cũ
            // Không làm gì cả. Backend sẽ hiểu là không có file thumbnail mới được gửi lên,
            // và sẽ giữ nguyên ảnh cũ trong database.
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
                // Sau khi cập nhật, có thể không cần điều hướng lại nếu vẫn ở cùng trang
                // Nhưng nếu muốn đảm bảo useEffect được kích hoạt lại để refetch chapters, có thể dùng:
                // navigate(`/admin/courses/edit/${courseId}`, { replace: true });
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
                toast.success(res.data.message || "Tạo khóa học thành công! Bạn có thể thêm chương ngay bây giờ.");
                // **Thay đổi quan trọng:** Lưu ID và tên khóa học mới
                setCourseCreatedId(res.data.course._id);
                setCourseCreatedName(res.data.course.title);
                // **Thay đổi quan trọng:** Điều hướng đến URL chỉnh sửa của khóa học vừa tạo
                // Điều này sẽ kích hoạt useEffect và hiển thị phần chương
                navigate(`/admin/courses/${res.data.course._id}`);
            }

        } catch (error) {
            console.error("Lỗi khi gửi form khóa học:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Thao tác thất bại.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm tạo các tùy chọn dải điểm mục tiêu dựa trên loại khóa học
    const getTargetScoreRangeOptions = () => {
        if (type === "IELTS") {
            return ["4.0-5.0", "5.0-6.0", "5.5-6.5", "6.0-7.0", "7.0-8.0", "8.0+"];
        } else { // TOEIC
            return ["250-350", "350-450", "450-550", "550-650", "650-850", "850+"];
        }
    };

    // Hàm xử lý thay đổi checkbox skills
    const handleSkillChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setSkills(prevSkills => [...prevSkills, value]);
        } else {
            setSkills(prevSkills => prevSkills.filter(skill => skill !== value));
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

    if (loading && isEditMode && !title) { // Hiển thị loading khi tải chi tiết khóa học ở chế độ chỉnh sửa
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
                    {/* --- Phần Upload Thumbnail --- */}
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
                                // removed required here to handle it manually in validation
                            />
                            <label htmlFor="fileInput" className="drop-label">
                                {thumbnailPreview ? (
                                    <img src={thumbnailPreview} alt="Thumbnail Preview" className="thumbnail-preview-large" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', marginBottom: '10px' }} />
                                ) : thumbnail ? (
                                    <span className="file-chip">{thumbnail.name}</span>
                                ) : (
                                    <>
                                        <span className="cloud-icon">☁</span>
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

                    {/* --- Phần Form Fields --- */}
                    <div className="form-fields">
                        <div className="form-group">
                            <label htmlFor="courseName">Tên khóa học *</label>
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
                            <label htmlFor="shortDesc">Mô tả ngắn *</label>
                            <input
                                id="shortDesc"
                                className="input"
                                placeholder="Nhập mô tả ngắn gọn về khóa học (dưới 100 ký tự)"
                                value={shortDescription}
                                onChange={(e) => setShortDescription(e.target.value)}
                                required
                                rows="2"
                                maxLength="100"
                                disabled={loading}
                            ></input>
                        </div>

                        <div className="form-group">
                            <label htmlFor="courseDesc">Mô tả khóa học *</label>
                            <input
                                id="courseDesc"
                                className="input"
                                placeholder="Nhập mô tả chi tiết khóa học"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows="5"
                                disabled={loading}
                            ></input>
                        </div>

                        <div className="form-group">
                            <label htmlFor="courseType">Loại khóa học *</label>
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

                        {/* Dropdown Dải điểm mục tiêu */}
                        <div className="form-group">
                            <label htmlFor="targetScoreRange">Dải điểm mục tiêu *</label>
                            <select
                                id="targetScoreRange"
                                className="input"
                                value={targetScoreRange}
                                onChange={(e) => setTargetScoreRange(e.target.value)}
                                required
                                disabled={loading}
                            >
                                <option value="">Chọn dải điểm</option>
                                {getTargetScoreRangeOptions().map(range => (
                                    <option key={range} value={range}>{range}</option>
                                ))}
                            </select>
                        </div>

                        {/* Checkboxes for Skills */}
                        <div className="form-group">
                            <label>Kỹ năng liên quan</label>
                            <div className="checkbox-group">
                                {["Listening", "Speaking", "Reading", "Writing", "General"].map(skillOption => (
                                    <label key={skillOption} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            value={skillOption}
                                            checked={skills.includes(skillOption)}
                                            onChange={handleSkillChange}
                                            disabled={loading}
                                        />
                                        {skillOption}
                                    </label>
                                ))}
                            </div>
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
                            <label htmlFor="coursePrice">Giá khóa học *</label>
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

                        <div className="form-group">
                            <label htmlFor="originalPrice">Giá gốc (nếu có giảm giá)</label>
                            <input
                                id="originalPrice"
                                type="number"
                                className="input"
                                placeholder="Nhập giá gốc"
                                value={originalPrice}
                                onChange={(e) => setOriginalPrice(e.target.value)}
                                min="0"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="discountPercentage">Phần trăm giảm giá (%)</label>
                            <input
                                id="discountPercentage"
                                type="number"
                                className="input"
                                placeholder="Nhập phần trăm giảm giá (0-100)"
                                value={discountPercentage}
                                onChange={(e) => setDiscountPercentage(e.target.value)}
                                min="0"
                                max="100"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="discountExpiresAt">Ngày hết hạn giảm giá</label>
                            <input
                                id="discountExpiresAt"
                                type="date"
                                className="input"
                                value={discountExpiresAt}
                                onChange={(e) => setDiscountExpiresAt(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="objectives">Mục tiêu khóa học *</label>
                            <input
                                id="objectives"
                                className="input"
                                placeholder="Mục tiêu 1, Mục tiêu 2, ..."
                                value={objectives}
                                onChange={(e) => setObjectives(e.target.value)}
                                required
                                rows="3"
                                disabled={loading}
                            ></input>
                            <small>Nhập các mục tiêu, cách nhau bởi dấu phẩy (,)</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="requirements">Yêu cầu khóa học</label>
                            <input
                                id="requirements"
                                className="input"
                                placeholder="Yêu cầu 1, Yêu cầu 2, ..."
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                                rows="3"
                                disabled={loading}
                            ></input>
                            <small>Nhập các yêu cầu, cách nhau bởi dấu phẩy (,)</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tags">Tags (Từ khóa)</label>
                            <input
                                id="tags"
                                type="text"
                                className="input"
                                placeholder="Tag1, Tag2, Tag3"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                disabled={loading}
                            />
                            <small>Nhập các từ khóa, cách nhau bởi dấu phẩy (,)</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Trạng thái</label>
                            <select
                                id="status"
                                className="input"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={loading}
                            >
                                <option value="draft">Bản nháp</option>
                                <option value="published">Đã xuất bản</option>
                                <option value="archived">Lưu trữ</option>
                            </select>
                        </div>

                        <button type="submit" className="create-btn" disabled={loading}>
                            {loading ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...') : (isEditMode ? 'Cập nhật khóa học' : 'Tạo khóa học')}
                        </button>
                    </div>
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
                            onClick={handleAddChapterClick}
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
                                                    onClick={() => handleEditChapter(chapter)}
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
                        <p>Chưa có chương nào cho khóa học này. Hãy thêm một chương!</p>
                    )}
                 </>
            )}
        </div>
    );
}

export default AddCourse;