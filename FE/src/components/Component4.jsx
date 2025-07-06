import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import '../main.css';

const Component4 = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayCount, setDisplayCount] = useState(6);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log("Attempting to fetch courses from: http://localhost:4000/api/v1/courses");
                const coursesResponse = await axios.get('http://localhost:4000/api/v1/courses');
                
                console.log("API Response received:", coursesResponse.data);

                if (coursesResponse.data && Array.isArray(coursesResponse.data.courses)) {
                    console.log("Courses array found:", coursesResponse.data.courses);
                    setCourses(coursesResponse.data.courses);
                } else {
                    console.warn("Unexpected API response format. Response data:", coursesResponse.data);
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

    return (
        <div className="component4-container">
            <div className="component4-title-main" style={{ textAlign: 'center', marginBottom: 16 }}>
                Kỹ năng nghề nghiệp <br />hiệu quả
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <button className="component4-button-free-trial" onClick={handleFreeTrial}>
                    Thử 7 ngày miễn phí
                </button>
            </div>

            {loading && (
                <div className="text-center text-lg text-gray-700" style={{ textAlign: 'center', margin: 40 }}>Đang tải khóa học...</div>
            )}

            {error && (
                <div className="text-center text-lg text-red-600 p-4 bg-red-100 border border-red-400 rounded-lg" style={{ textAlign: 'center', margin: 40 }}>
                    {error}
                </div>
            )}

            {!loading && !error && courses.length === 0 && (
                <div className="text-center text-lg text-gray-700" style={{ textAlign: 'center', margin: 40 }}>Không tìm thấy khóa học nào.</div>
            )}

            {/* Danh sách card dạng lưới đẹp */}
            {!loading && !error && courses.length > 0 && (
                <div className="result-list2">
                    {courses.slice(0, displayCount).map((course) => (
                        <Link 
                            to={`/course/${course._id}`}
                            className="result-card"
                            style={{ textDecoration: 'none', color: 'inherit', margin: '0 12px 24px 0' }}
                            key={course._id}
                        >
                            <div className="result-card-inner">
                                <img 
                                    className="result-main-image" 
                                    src={course.thumbnail || 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'} 
                                    alt={course.title} 
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/E0E0E0/333333?text=No+Image'; }}
                                />
                                <img 
                                    className="result-avatar" 
                                    src={'Component4b.jpg'} 
                                    alt="Instructor Avatar" 
                                />
                                <div className="result-title">{course.title}</div>
                                <div className="result-subtitle">{course.courseType || 'Chưa rõ loại'}</div>
                                {course.price !== undefined && (
                                    <div className="result-price">
                                        {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN') || 'N/A'} VNĐ`}
                                    </div>
                                )}
                                {course.shortDescription && (
                                    <div className="result-description">{course.shortDescription}</div>
                                )}
                                {course.enrolledCount !== undefined && (
                                    <div className="result-subtitle" style={{ fontSize: '0.9rem', color: '#888' }}>
                                        {course.enrolledCount} học viên
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Nút "Hiển thị thêm 6" */}
            {courses.length > displayCount && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <button className="component4-button-more" onClick={handleShowMore}>
                        Hiển thị thêm 6
                    </button>
                </div>
            )}
        </div>
    );
};

export default Component4;
