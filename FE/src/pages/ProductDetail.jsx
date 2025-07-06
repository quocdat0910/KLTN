import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../main.css'; // Đảm bảo đường dẫn đúng đến file CSS của bạn
import PaymentForm from '../components/PaymentForm'; // Đảm bảo đường dẫn đúng

const ProductDetail = () => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [courseDetail, setCourseDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [openChapterIds, setOpenChapterIds] = useState(new Set());
    const [loadedChapterDetails, setLoadedChapterDetails] = useState({});
    const [totalDuration, setTotalDuration] = useState(0); // Thêm state cho tổng thời lượng
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentLoading, setEnrollmentLoading] = useState(true);

    // Kiểm tra xem user có đến từ trang MyCourse không
    const isFromMyCourse = location.state?.fromMyCourse || false;

    // Hàm tính tổng thời lượng từ tất cả lessons
    const calculateTotalDuration = (chapters, loadedDetails = {}) => {
        if (!chapters || chapters.length === 0) return 0;
        
        let totalSeconds = 0;
        chapters.forEach(chapter => {
            // Kiểm tra xem chapter này đã được load chi tiết chưa
            const chapterDetails = loadedDetails[chapter._id];
            if (chapterDetails && chapterDetails.lessons) {
                // Sử dụng dữ liệu đã load
                chapterDetails.lessons.forEach(lesson => {
                    if (lesson.videoDuration) {
                        totalSeconds += lesson.videoDuration;
                    }
                });
            } else if (chapter.lessons && chapter.lessons.length > 0) {
                // Sử dụng dữ liệu từ course detail
                chapter.lessons.forEach(lesson => {
                    if (lesson.videoDuration) {
                        totalSeconds += lesson.videoDuration;
                    }
                });
            }
        });
        
        return totalSeconds;
    };

    // Hàm format thời gian từ giây sang giờ và phút
    const formatDuration = (totalSeconds) => {
        if (totalSeconds === 0) return 'Chưa rõ';
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0 && minutes > 0) {
            return `${hours} giờ ${minutes} phút`;
        } else if (hours > 0) {
            return `${hours} giờ`;
        } else if (minutes > 0) {
            return `${minutes} phút`;
        } else {
            return 'Dưới 1 phút';
        }
    };

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

                const token = localStorage.getItem('token');
                const headers = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                console.log(`Attempting to fetch course details for ID: ${courseId}`);
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
                if (err.response) {
                    if (err.response.status === 404) {
                        setError("Không tìm thấy khóa học này.");
                        toast.error("Không tìm thấy khóa học.");
                        navigate('/');
                    } else if (err.response.status === 403) {
                        setError("Bạn không có quyền truy cập khóa học này.");
                        toast.error("Không có quyền truy cập.");
                        navigate('/');
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

        const checkEnrollment = async () => {
            try {
                setEnrollmentLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    setIsEnrolled(false);
                    return;
                }

                const response = await axios.get(`http://localhost:4000/api/v1/enrollments`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const userEnrollment = response.data.enrollments.find(
                    enrollment => enrollment.courseId._id === courseId
                );
                
                setIsEnrolled(!!userEnrollment);
            } catch (error) {
                console.error("Error checking enrollment:", error);
                setIsEnrolled(false);
            } finally {
                setEnrollmentLoading(false);
            }
        };

        fetchCourseDetail();
        checkEnrollment();
    }, [courseId, navigate]);

    // Tính lại tổng thời lượng khi loadedChapterDetails thay đổi
    useEffect(() => {
        if (courseDetail && courseDetail.chapters) {
            setTotalDuration(calculateTotalDuration(courseDetail.chapters, loadedChapterDetails));
        }
    }, [loadedChapterDetails, courseDetail]);

    const fetchChapterDetails = async (chapterId) => {
        if (loadedChapterDetails[chapterId]) {
            return; // Already loaded, no need to fetch again
        }

        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const response = await axios.get(`http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}`, { headers });

            if (response.data && response.data.chapter) {
                const newChapterDetails = {
                    ...loadedChapterDetails,
                    [chapterId]: {
                        lessons: response.data.chapter.lessons || [],
                        exercises: response.data.chapter.exercises || []
                    }
                };
                
                setLoadedChapterDetails(newChapterDetails);
            } else {
                toast.error("Không tìm thấy chi tiết cho chương này.");
            }
        } catch (err) {
            console.error("Error fetching chapter details:", err);
            toast.error("Lỗi khi tải chi tiết chương.");
        }
    };

    const handleBuyClick = () => {
        if (!courseDetail) {
            toast.warn("Chưa tải xong thông tin khóa học.");
            return;
        }

        // Nếu đến từ MyCourse và đã đăng ký, chuyển đến trang học
        if (isFromMyCourse && isEnrolled) {
            navigate(`/learn/${courseId}`);
            return;
        }

        // Nếu không đến từ MyCourse, kiểm tra enrollment
        if (!isFromMyCourse) {
            if (isEnrolled) {
                toast.info("Bạn đã mua khóa học này rồi!");
                return;
            }
        }

        setShowPaymentForm(true);
    };

    const handleStartLearning = () => {
        navigate(`/learn/${courseId}`);
    };

    const handleClosePaymentForm = () => {
        setShowPaymentForm(false);
    };

    const toggleChapter = (chapterId) => {
        setOpenChapterIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(chapterId)) {
                newIds.delete(chapterId); // Đóng chương
            } else {
                newIds.add(chapterId); // Mở chương
                fetchChapterDetails(chapterId);
            }
            return newIds;
        });
    };

    const getChapterContent = (chapterId) => {
        return loadedChapterDetails[chapterId];
    };

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

    // Lọc và sắp xếp các chương
    const sortedChapters = courseDetail.chapters
        ? [...courseDetail.chapters].sort((a, b) => a.order - b.order)
        : [];

    // Xác định text và action cho button
    let buttonText = "Mua khóa học";
    let buttonAction = handleBuyClick;

    if (isFromMyCourse && isEnrolled) {
        buttonText = "Bắt đầu học";
        buttonAction = handleStartLearning;
    }

    return (
        <div className="detail-container">
            {/* Background element, adjust its size if the main container is fixed */}
            <div className="detail-bg" />

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

            <div className="detail-price">
                {courseDetail.price === 0 ? 'Miễn phí' : `${courseDetail.price?.toLocaleString('vi-VN') || 'N/A'} VNĐ`}
            </div>

            {!enrollmentLoading && (
                <div className="detail-buy-button" onClick={buttonAction}>
                    <div className="detail-buy-button-text">
                        {buttonText}
                    </div>
                </div>
            )}

            {/* Các tính năng khóa học */}
            <div className="detail-feature detail-feature-1">- Loại khóa học: {courseDetail.courseType || 'Chưa rõ'}</div>
            <div className="detail-feature detail-feature-2">- Tổng: {courseDetail.chapters?.length || 0} chương</div> {/* Cập nhật số chương thực tế */}
            <div className="detail-feature detail-feature-3">- Thời lượng: {formatDuration(totalDuration)}</div>
            <div className="detail-feature detail-feature-4">- Học mọi lúc mọi nơi</div>

            {/* Phần "Nội dung khóa học" và danh sách chương */}
            <div className="detail-content-title">Nội dung khóa học</div>

            <div className="detail-chapter-info-summary">
                <span className="chapter-count">{courseDetail.chapters?.length || 0} chương</span>
                <span className="duration-info">Thời lượng: {formatDuration(totalDuration)}</span>
            </div>

            {sortedChapters.length > 0 ? (
                <div className="chapter-list-section">
                    {sortedChapters.map(chapter => {
                        const chapterContent = getChapterContent(chapter._id);
                        const isChapterOpen = openChapterIds.has(chapter._id);

                        return (
                            <div key={chapter._id} className="chapter-item">
                                <div
                                    className={`detail-chapter-box ${isChapterOpen ? 'open' : ''}`}
                                    onClick={() => toggleChapter(chapter._id)}
                                >
                                    <div className="detail-chapter-title">
                                        Chương {chapter.order}: {chapter.title}
                                    </div>
                                    <span className="toggle-icon">{isChapterOpen ? '-' : '+'}</span>
                                </div>
                                <div className={`chapter-content ${isChapterOpen ? 'open' : 'closed'}`}>
                                    {/* Hiển thị description, videoUrl, fileUrl của chapter (từ courseDetail ban đầu) */}
                                    {chapter.description && <p>{chapter.description}</p>}
                                    {chapter.videoUrl && (
                                        <div className="video-container">
                                            <iframe
                                                src={chapter.videoUrl}
                                                title={`Video chương ${chapter.title}`}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}
                                    {chapter.fileUrl && (
                                        <p>Tài liệu đính kèm chương: <a href={chapter.fileUrl} target="_blank" rel="noopener noreferrer">Tải về</a></p>
                                    )}

                                    {isChapterOpen && !chapterContent && (
                                        <p className="loading-content-message">Đang tải nội dung chi tiết chương...</p>
                                    )}

                                    {isChapterOpen && chapterContent && (
                                        <>
                                            {/* HIỂN THỊ LESSONS */}
                                           {chapterContent.lessons && chapterContent.lessons.filter(lesson => lesson.isPublished).length > 0 && (
                                                <div className="chapter-sub-list">
                                                    {chapterContent.lessons
                                                    .filter(lesson => lesson.isPublished)
                                                    .map(lesson => (
                                                        <div key={lesson._id} className="lesson-item">
                                                        <img src="/video.png" alt="Video Icon" className="inline-icon" />
                                                        <span className="lesson-title">{lesson.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                )}
                                            {/* {(!chapterContent.lessons || chapterContent.lessons.length === 0) && (
                                                <p className="no-content-message">Chưa có bài học nào cho chương này.</p>
                                            )} */}

                                           {chapterContent.exercises && chapterContent.exercises.filter(ex => ex.isPublished).length > 0 && (
                                        <div className="chapter-sub-list">
                                            {chapterContent.exercises
                                            .filter(ex => ex.isPublished)
                                            .map(exercise => (
                                                <div key={exercise._id} className="lesson-item">
                                                <img src="/homework.png" alt="Homework Icon" className="inline-icon" />
                                                <span className="lesson-title">{exercise.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                        )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="detail-no-chapters">Chưa có chương nào cho khóa học này.</div>
            )}

            {showPaymentForm && (
                <div className="payment-overlay">
                    <PaymentForm
                        course={courseDetail}
                        onClose={handleClosePaymentForm}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductDetail;