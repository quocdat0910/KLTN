import '../../Component.css'; // Đảm bảo đường dẫn CSS chính xác
import React, { useState, useEffect, useContext } from 'react';
import { FaTrash, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../../main'; // Đảm bảo đường dẫn Context chính xác

const Course = () => {
    // Lấy trạng thái xác thực, thông tin người dùng và TRẠNG THÁI LOADING từ Context
    const { isAuthenticated, user, loading: contextLoading } = useContext(Context);
    const navigateTo = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true); // Loading cho việc fetch courses
    const [error, setError] = useState(null);

    // --- GUARD: Kiểm tra quyền admin sau khi Context đã tải xong ---
    useEffect(() => {
        // Nếu Context vẫn đang tải (đang kiểm tra token/profile), DỪNG LẠI
        if (contextLoading) {
            return;
        }

        // Nếu Context đã tải xong và KHÔNG xác thực HOẶC user không phải admin
        if (!isAuthenticated) {
            toast.error("Bạn cần đăng nhập để truy cập trang này.");
            navigateTo("/login"); // Chuyển hướng đến trang đăng nhập
        } else if (user && user.role !== "admin") { // Kiểm tra user null trước khi truy cập user.role
            toast.error("Bạn không có quyền truy cập trang này.");
            navigateTo("/"); // Chuyển hướng về trang chủ
        }
    }, [isAuthenticated, user, contextLoading, navigateTo]); // Thêm contextLoading vào dependency

    // Hàm bất đồng bộ để gọi API lấy danh sách khóa học
    const fetchCourses = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
                setLoading(false);
                navigateTo("/login"); // Chuyển hướng đến trang đăng nhập
                return;
            }

            // Gửi yêu cầu với limit rất lớn để lấy gần như tất cả các khóa học
            // Hoặc gửi ?all=true nếu bạn đã triển khai logic đó ở backend
            const res = await axios.get(`http://localhost:4000/api/v1/courses/admin`, { // hoặc ?all=true nếu backend hỗ trợ
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true,
            });

            // Nếu backend của bạn vẫn trả về totalPages và total, bạn có thể bỏ qua chúng.
            setCourses(res.data.courses);
            setLoading(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định khi tải khóa học.";
            console.error("Lỗi khi fetch khóa học:", errorMessage);
            setError(errorMessage);
            setLoading(false);
            toast.error(`Lỗi: ${errorMessage}`);
            if (err.response && err.response.status === 401) {
                navigateTo("/login");
            }
        }
    };

    // useEffect hook để gọi fetchCourses sau khi Context tải xong và user là admin
    useEffect(() => {
        // Chỉ fetch dữ liệu nếu Context đã tải xong, người dùng đã xác thực và là admin
        if (!contextLoading && isAuthenticated && user && user.role === "admin") {
            fetchCourses();
        }
    }, [isAuthenticated, user, contextLoading]); // dependencies chỉ còn những cái cần thiết

    // Hàm để xử lý việc xóa một khóa học
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
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true,
                });
                toast.success(res.data.message || "Xóa khóa học thành công!");
                fetchCourses(); // Tải lại danh sách khóa học sau khi xóa thành công
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || "Xóa khóa học thất bại.";
                console.error("Lỗi khi xóa khóa học:", errorMessage);
                toast.error(`Lỗi: ${errorMessage}`);
                if (err.response && err.response.status === 401) {
                    navigateTo("/login");
                }
            }
        }
    };

    // Hàm để xử lý việc chỉnh sửa khóa học (chỉ điều hướng)
    const handleEditCourse = (id) => {
        navigateTo(`/admin/courses/${id}`); // Điều hướng đến trang chỉnh sửa với ID khóa học
    };

    // --- Render dựa trên trạng thái tải và lỗi ---
    if (contextLoading) {
        return (
            <div className="dashboard-container">
                <p>Đang kiểm tra quyền truy cập...</p>
            </div>
        );
    }

    if (!isAuthenticated || (user && user.role !== "admin")) {
        return null; // Đã chuyển hướng trong useEffect
    }

    if (loading) {
        return (
            <div className="dashboard-container">
                <p>Đang tải danh sách khóa học, vui lòng chờ...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <p className="error-message">Đã xảy ra lỗi: {error}</p>
                <button className="add-btn" onClick={fetchCourses}>Thử tải lại</button>
            </div>
        );
    }
    console.log("Courses data:", courses);

    // --- Render UI chính sau khi dữ liệu đã được tải và không có lỗi ---
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className='h2'>Quản lý Khóa học</h2>
            </div>

            <div className="search-add">
                <button onClick={() => navigateTo("/admin/courses/new")} className="add-btn">Thêm khóa học</button>
                {/* Đã xóa các input filter và pagination UI */}
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
                                <td>{course.shortDescription ? course.shortDescription.substring(0, 50) + (course.shortDescription.length > 50 ? '...' : '') : 'N/A'}</td>
                                <td>{course.price.toLocaleString('vi-VN')} VNĐ</td>
                                <td>{course.courseType}</td>
                                <td>{course.status === 'published' ? 'Đã xuất bản' : course.status === 'draft' ? 'Nháp' : course.status}</td>
                                <td className="action-icons">
                                    <FaEdit className="icon edit" onClick={() => handleEditCourse(course._id)} title="Sửa khóa học" />
                                    <FaTrash className="icon delete" onClick={() => handleDeleteCourse(course._id)} title="Xóa khóa học" />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9">Chưa có khóa học nào để hiển thị.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Đã xóa phần phân trang */}
            {/* <div className="pagination">
                <span className="prev">&lt; Previous</span>
                <span className="page active">1</span>
                <span className="next">Next &gt;</span>
            </div> */}
        </div>
    );
};

export default Course;