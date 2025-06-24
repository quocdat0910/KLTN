import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams và useNavigate
import { toast } from 'react-toastify';
import '../main.css';
import PaymentForm from '../components/PaymentForm';

const ProductDetail = () => {
    const { id: courseId } = useParams(); // Lấy courseId từ URL, đổi tên thành courseId
    const navigate = useNavigate(); // Dùng để điều hướng nếu có lỗi

    const [courseDetail, setCourseDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    // State để quản lý chương nào đang được mở rộng
    const [openChapterId, setOpenChapterId] = useState(null); 

    useEffect(() => {
        const fetchCourseDetail = async () => {
            if (!courseId) {
                setError("Không tìm thấy ID khóa học trong URL.");
                setLoading(false);
                toast.error("Không tìm thấy ID khóa học.");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Lấy token từ localStorage (nếu API getCourseById yêu cầu)
                // Theo router đã sửa, getCourseById công khai không cần token
                // Tuy nhiên, nếu bạn có logic khác yêu cầu xác thực, hãy thêm vào
                const token = localStorage.getItem('token');
                const headers = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }


                console.log(`Attempting to fetch course details for ID: ${courseId}`);
                // Gửi request với headers nếu có
                const response = await axios.get(`http://localhost:4000/api/v1/courses/${courseId}`, { headers });


                console.log("Course API Response received:", response.data);

                if (response.data && response.data.course) {
                    setCourseDetail(response.data.course);
                } else {
                    setError("Không tìm thấy dữ liệu khóa học hoặc định dạng không hợp lệ.");
                    toast.error("Không tìm thấy dữ liệu khóa học.");
                }
            } catch (err) {
                console.error("Error fetching course details:", err);
                // Xử lý các loại lỗi cụ thể từ backend
                if (err.response) {
                    if (err.response.status === 404) {
                        setError("Không tìm thấy khóa học này.");
                        toast.error("Không tìm thấy khóa học.");
                        navigate('/'); // Quay về trang chủ nếu khóa học không tồn tại
                    } else if (err.response.status === 403) {
                        setError("Bạn không có quyền truy cập khóa học này.");
                        toast.error("Không có quyền truy cập.");
                        navigate('/'); // Quay về trang chủ nếu không có quyền
                    } else {
                        setError(err.response.data?.message || "Lỗi khi tải chi tiết khóa học.");
                        toast.error(err.response.data?.message || "Lỗi tải chi tiết khóa học!");
                    }
                } else {
                    setError("Lỗi mạng hoặc server không phản hồi.");
                    toast.error("Lỗi kết nối server.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetail();
    }, [courseId, navigate]); // Dependency array: Re-run when courseId changes

    const handleBuyClick = () => {
        if (!courseDetail) {
            toast.warn("Chưa tải xong thông tin khóa học.");
            return;
        }
        setShowPaymentForm(true);
    };

    const handleClosePaymentForm = () => {
        setShowPaymentForm(false);
    };

    // Hàm để đóng/mở chương
    const toggleChapter = (chapterId) => {
        setOpenChapterId(prevId => (prevId === chapterId ? null : chapterId));
    };

    // --- Conditional Rendering for Loading, Error, No Course ---
    if (loading) {
        return (
            <div className="detail-container flex items-center justify-center min-h-screen">
                <p className="text-gray-700 text-lg">Đang tải chi tiết khóa học...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container flex items-center justify-center min-h-screen">
                <div className="text-center text-red-600 p-4 bg-red-100 border border-red-400 rounded-lg">
                    <p className="text-lg">{error}</p>
                    <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Quay về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    if (!courseDetail) {
        return (
            <div className="detail-container flex items-center justify-center min-h-screen">
                <p className="text-gray-700 text-lg">Không tìm thấy thông tin khóa học này.</p>
            </div>
        );
    }

    // --- Render Course Details ---
    return (
        <div className="detail-container">
            <div className="detail-bg" /> {/* Background element */}

            {/* Title and main image section */}
            <div className="detail-main-title">{courseDetail.title}</div>
            <div className="detail-description">
                {courseDetail.description}
            </div>

            <img
                className="detail-course-img"
                src={courseDetail.thumbnail || 'https://placehold.co/800x450/E0E0E0/333333?text=No+Image'}
                alt={courseDetail.title}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x450/E0E0E0/333333?text=No+Image'; }}
            />

            {/* Static icons (if not dynamic from backend) */}
            <img className="detail-icon-img2" src="/video.png" alt="Icon Video" />
            <img className="detail-icon-img" src="/homework.png" alt="Icon Homework" />
            <div className="detail-subtitle">Bài tập</div>


            {/* Course Info */}
            <div className="detail-info detail-info-chapter">{courseDetail.chapters?.length || 0} chương</div>
            <div className="detail-info detail-info-duration">Thời lượng: {courseDetail.duration ? `${courseDetail.duration} giờ` : 'Chưa rõ'}</div>
            <div className="detail-price">
                {courseDetail.price === 0 ? 'Miễn phí' : `${courseDetail.price?.toLocaleString('vi-VN') || 'N/A'} VNĐ`}
            </div>
            {courseDetail.enrolledCount !== undefined && (
                <div className="detail-info detail-info-enrolled">
                    {courseDetail.enrolledCount} học viên đã đăng ký
                </div>
            )}


            {/* Buy button */}
            <div className="detail-buy-button" onClick={handleBuyClick}>
                <div className="detail-buy-button-text">Mua khóa học</div>
            </div>

            {/* Static features. If these should be dynamic, they need to be in your Course model */}
            <div className="detail-feature detail-feature-1">- Trình độ: {courseDetail.level || 'Chưa rõ'}</div>
            <div className="detail-feature detail-feature-2">- Loại: {courseDetail.type || 'Chưa rõ'}</div>
            <div className="detail-feature detail-feature-3">- Ngôn ngữ: {courseDetail.language || 'Chưa rõ'}</div>
            <div className="detail-feature detail-feature-4">- Học mọi lúc mọi nơi</div>

            {/* Content Sections */}
            <div className="detail-section-title">Giới thiệu</div>
            <div className="detail-content-title">Nội dung khóa học</div>

            {/* Chapter List - DYNAMICALLY RENDERED */}
            {courseDetail.chapters && courseDetail.chapters.length > 0 ? (
                <div className="chapter-list-section">
                    {courseDetail.chapters
                        .sort((a, b) => a.order - b.order) // Sắp xếp các chương theo thứ tự
                        .map(chapter => (
                        <div key={chapter._id} className="chapter-item">
                            <div 
                                className="detail-chapter-box" 
                                onClick={() => toggleChapter(chapter._id)}
                            >
                                <div className="detail-chapter-title">
                                    {openChapterId === chapter._id ? '-' : '+'} Chương {chapter.order}: {chapter.title}
                                </div>
                            </div>
                            {/* Hiển thị nội dung chi tiết của chương khi mở rộng */}
                            {openChapterId === chapter._id && (
                                <div className="chapter-content">
                                    {chapter.description && <p>{chapter.description}</p>}
                                    {chapter.videoUrl && (
                                        <div className="video-container">
                                            <iframe
                                                src={chapter.videoUrl}
                                                title={`Video bài học ${chapter.title}`}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}
                                    {chapter.fileUrl && (
                                        <p>Tài liệu đính kèm: <a href={chapter.fileUrl} target="_blank" rel="noopener noreferrer">Tải về</a></p>
                                    )}
                                    {/* Bạn có thể thêm hiển thị quizzes tại đây nếu populate chúng */}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="detail-no-chapters">Chưa có chương nào cho khóa học này.</div>
            )}

            {/* Payment form - TRUYỀN PROPS Ở ĐÂY */}
            {showPaymentForm && (
                <div className="payment-overlay">
                    <PaymentForm 
                        course={courseDetail}     
                        onClose={handleClosePaymentForm} 
                    />
                    {/* Nút đóng này đã được di chuyển vào bên trong PaymentForm, nên có thể bỏ đi */}
                    <button className="payment-close-button" onClick={handleClosePaymentForm}>
                        Đóng
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
