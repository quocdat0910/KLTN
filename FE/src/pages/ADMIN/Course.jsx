import '../../Component.css'; 
import React, { useState, useEffect, useContext } from 'react';
import { FaTrash, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../../main';

const Course = () => {
    const { isAuthenticated, user, loading: contextLoading } = useContext(Context);
    const navigateTo = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch courses ---
    const fetchCourses = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
                setLoading(false);
                navigateTo("/login");
                return;
            }

            const res = await axios.get(`http://localhost:4000/api/v1/courses/admin?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            console.log("Courses data:", res.data.courses);
            setCourses(res.data.courses || []);
            setLoading(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định khi tải khóa học.";
            setError(errorMessage);
            setLoading(false);
            toast.error(`Lỗi: ${errorMessage}`);
            if (err.response && err.response.status === 401) {
                navigateTo("/login");
            }
        }
    };

    useEffect(() => {
        if (!contextLoading && isAuthenticated && user && user.role === "admin") {
            fetchCourses();
        }
    }, [isAuthenticated, user, contextLoading]);

    // --- Handle delete ---
    const handleDeleteCourse = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                    navigateTo("/login");
                    return;
                }

                const res = await axios.delete(`http://localhost:4000/api/v1/courses/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                toast.success(res.data.message || "Xóa khóa học thành công!");
                fetchCourses();
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || "Xóa khóa học thất bại.";
                toast.error(`Lỗi: ${errorMessage}`);
                if (err.response && err.response.status === 401) {
                    navigateTo("/login");
                }
            }
        }
    };

    const handleEditCourse = (id) => {
        navigateTo(`/admin/courses/${id}`);
    };

    // --- UI states ---
    if (contextLoading) return <div className="dashboard-container"><p>Đang kiểm tra quyền truy cập...</p></div>;
    if (!isAuthenticated || (user && user.role !== "admin")) return null;
    if (loading) return <div className="dashboard-container"><p>Đang tải danh sách khóa học...</p></div>;
    if (error) return (
        <div className="dashboard-container">
            <p className="error-message">Đã xảy ra lỗi: {error}</p>
            <button className="add-btn" onClick={fetchCourses}>Thử tải lại</button>
        </div>
    );

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className='h2'>Quản lý Khóa học</h2>
            </div>

            <div className="search-add">
                <button onClick={() => navigateTo("/admin/courses/new")} className="add-btn">Thêm khóa học</button>
            </div>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Khóa học</th>
                        <th>Mô tả</th>
                        <th>Giá</th>
                        <th>Loại</th>
                        <th>Tình trạng</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.length > 0 ? (
                        courses.map((course, index) => (
                            <tr key={course._id}>
                                <td>{index + 1}</td>
                                <td>{course.title}</td>
                                <td>{course.shortDescription 
                                    ? course.shortDescription.substring(0, 50) + (course.shortDescription.length > 50 ? '...' : '') 
                                    : 'N/A'}
                                </td>
                                <td>{course.price.toLocaleString('vi-VN')} VNĐ</td>
                                <td>{course.courseType}</td>
                                <td>
                                    {course.status === 'published' 
                                        ? 'Đã xuất bản' 
                                        : course.status === 'draft' 
                                            ? 'Nháp' 
                                            : course.status}
                                </td>
                                <td className="action-icons">
                                    <FaEdit 
                                        className="icon edit" 
                                        onClick={() => handleEditCourse(course._id)} 
                                        title="Sửa khóa học" 
                                    />
                                    <FaTrash 
                                        className="icon delete" 
                                        onClick={() => handleDeleteCourse(course._id)} 
                                        title="Xóa khóa học" 
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7">Chưa có khóa học nào để hiển thị.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Course;
