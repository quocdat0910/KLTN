import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // <--- Đã thêm import này
import '../main.css';

const Component4 = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayCount, setDisplayCount] = useState(6); // Số lượng khóa học hiển thị ban đầu

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log("Attempting to fetch courses from: http://localhost:4000/api/v1/courses");
                const response = await axios.get('http://localhost:4000/api/v1/courses');
                
                console.log("API Response received:", response.data);

                if (response.data && Array.isArray(response.data.courses)) {
                    console.log("Courses array found:", response.data.courses);
                    setCourses(response.data.courses);
                } else {
                    console.warn("Unexpected API response format. Response data:", response.data);
                    setCourses([]);
                    toast.warn("Dữ liệu khóa học nhận được không đúng định dạng. Vui lòng kiểm tra API.");
                }
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError(err.response?.data?.message || "Không thể tải danh sách khóa học. Vui lòng thử lại sau.");
                toast.error(err.response?.data?.message || "Lỗi tải khóa học!");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleShowMore = () => {
        setDisplayCount(prevCount => Math.min(prevCount + 6, courses.length));
        if (displayCount >= courses.length) {
            toast.info("Đã hiển thị tất cả khóa học có sẵn!");
        }
    };

    const handleFreeTrial = () => {
        toast.info("Chức năng thử 7 ngày miễn phí đang được phát triển!");
    };

    const cardPositions = [
        { left: 1070, top: 48 },
        { left: 1070, top: 387 },
        { left: 774, top: 48 },
        { left: 774, top: 387 },
        { left: 479, top: 48 },
        { left: 479, top: 387 },
    ];

    return (
        <div className="component4-container">
            <div className="component4-background" />

            <div className="component4-title-main">
                Kỹ năng nghề nghiệp <br />hiệu quả
            </div>

            {loading && (
                <div className="text-center text-lg text-gray-700" style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10}}>Đang tải khóa học...</div>
            )}

            {error && (
                <div className="text-center text-lg text-red-600 p-4 bg-red-100 border border-red-400 rounded-lg" style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10}}>
                    {error}
                </div>
            )}

            {!loading && !error && courses.length === 0 && (
                <div className="text-center text-lg text-gray-700" style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10}}>Không tìm thấy khóa học nào.</div>
            )}

            {/* Thẻ học phần - Áp dụng UI cũ */}
            {!loading && !error && courses.slice(0, displayCount).map((course, i) => {
                const position = cardPositions[i % cardPositions.length]; 
                if (!position) {
                    console.warn(`No predefined position for card index ${i}. Consider extending cardPositions array or changing layout method.`);
                    return null; 
                }

                return (
                    // Sử dụng Link để bọc thẻ, tạo đường dẫn đến trang chi tiết
                    <Link 
                        to={`/course/${course._id}`} // <--- Đường dẫn tới trang chi tiết khóa học
                        className="component4-card-link" // Thêm class này nếu bạn muốn style riêng cho Link
                        style={{ 
                            position: 'absolute', 
                            left: position.left, 
                            top: position.top,
                            textDecoration: 'none', // Bỏ gạch chân mặc định của Link
                            color: 'inherit', // Giữ màu chữ mặc định
                            display: 'block' // Đảm bảo Link chiếm đủ không gian của card
                        }} 
                        key={course._id}
                    >
                        <div className="component4-card"> {/* Giữ nguyên nội dung card */}
                            <div className="component4-card-bg" />
                            <img 
                                className="component4-main-img" 
                                src={course.thumbnail || 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'} 
                                alt={course.title} 
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'; }}
                            />
                            <img 
                                className="component4-avatar" 
                                src={'Component4b.jpg'} // Placeholder avatar
                                alt="Instructor Avatar" 
                            />
                            <div className="component4-title">{course.title}</div>
                            <div className="component4-subtitle">
                                {course.level || 'Chưa rõ cấp độ'} - {course.type || 'Chưa rõ loại'}
                            </div>
                            {course.price !== undefined && (
                                <div className="component4-price">
                                    {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN') || 'N/A'} VNĐ`}
                                </div>
                            )}
                            {course.enrolledCount !== undefined && (
                                <div className="component4-enrolled-count">
                                    {course.enrolledCount} học viên
                                </div>
                            )}
                        </div>
                    </Link>
                );
            })}

            {/* Nút "Hiển thị thêm 6" */}
            {courses.length > displayCount && (
                <button className="component4-button-more" onClick={handleShowMore}>
                    Hiển thị thêm 6
                </button>
            )}

            {/* Nút "Thử 7 ngày miễn phí" */}
            <button className="component4-button-free-trial" onClick={handleFreeTrial}>
                Thử 7 ngày miễn phí
            </button>
        </div>
    );
};

export default Component4;
