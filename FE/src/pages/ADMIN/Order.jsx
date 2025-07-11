import '../../Component.css';
import React, { useState, useEffect, useContext } from 'react';
import { FaTrash, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { toast } from 'react-toastify';
import { Context } from '../../main';

const Order = () => {
    const { isAuthenticated, user, loading: contextLoading } = useContext(Context);
    const navigateTo = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (contextLoading) return;
        if (!isAuthenticated) {
            toast.error("Bạn cần đăng nhập để truy cập trang này.");
            navigateTo("/login");
        } else if (user && user.role !== "admin") {
            toast.error("Bạn không có quyền truy cập trang này.");
            navigateTo("/");
        }
    }, [isAuthenticated, user, contextLoading, navigateTo]);

    const fetchOrders = async () => {
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
            const res = await axios.get(`http://localhost:4000/api/v1/enrollments/all`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true,
            });
            setOrders(res.data.enrollments);
            setLoading(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Lỗi không xác định khi tải đơn hàng.";
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
            fetchOrders();
        }
    }, [isAuthenticated, user, contextLoading]);

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
    if (loading) {
        return (
            <div className="dashboard-container">
                <p>Đang tải danh sách đơn hàng, vui lòng chờ...</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="dashboard-container">
                <p className="error-message">Đã xảy ra lỗi: {error}</p>
                <button className="add-btn" onClick={fetchOrders}>Thử tải lại</button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className='h2'>Quản lý Đơn hàng</h2>
            </div>
            <table className="user-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Người mua</th>
                        <th>Khóa học</th>
                        <th>Số tiền</th>
                        <th>Ngày đăng ký</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length > 0 ? (
                        orders.map((order, index) => (
                            <tr key={order._id}>
                                <td>{index + 1}</td>
                                <td>{order.userId?.name || order.userId?.email || 'N/A'}</td>
                                <td>{order.courseId?.title || 'N/A'}</td>
                                <td>{order.paymentDetails?.amount?.toLocaleString('vi-VN') || 'N/A'} VNĐ</td>
                                <td>{order.enrolledAt ? new Date(order.enrolledAt).toLocaleString('vi-VN') : 'N/A'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">Chưa có đơn hàng nào để hiển thị.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Order;
