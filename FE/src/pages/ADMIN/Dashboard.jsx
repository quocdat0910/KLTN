/**
 * Dashboard Admin chuyên nghiệp
 * - 4 thẻ thống kê: Courses, Users, Orders, Revenue
 * - 2 biểu đồ: Đăng ký theo tháng, User mới theo tháng
 * - 2 bảng nhỏ: Khóa học mới, Đơn hàng mới
 * - Nút thao tác nhanh
 */
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Component.css";

function Dashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    users: 0,
    orders: 0,
    revenue: 0,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Lấy tổng số khóa học
        const courseRes = await axios.get("/api/v1/courses/admin?limit=5&sort=-createdAt", { withCredentials: true });
        setStats((s) => ({ ...s, courses: courseRes.data.total || 0 }));
        setRecentCourses(courseRes.data.courses || []);

        // Lấy tổng số người dùng
        const userRes = await axios.get("/api/v1/users", { withCredentials: true });
        setStats((s) => ({ ...s, users: userRes.data.users.length }));

        // Lấy tổng số đơn hàng và doanh thu
        const orderRes = await axios.get("/api/v1/enrollments/all", { withCredentials: true });
        setStats((s) => ({
          ...s,
          orders: orderRes.data.enrollments.length,
          revenue: orderRes.data.enrollments.reduce((sum, e) => sum + (e.paymentDetails?.amount || 0), 0)
        }));
        setRecentOrders(orderRes.data.enrollments.slice(-5).reverse());
      } catch (err) {
        // Xử lý lỗi
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="dashboard-admin-container">
      <h2 className="h2">Dashboard Quản trị</h2>
      <div className="dashboard-stats-row">
        <div className="dashboard-stat-card">
          <div className="stat-title">Khóa học</div>
          <div className="stat-value">{stats.courses}</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-title">Người dùng</div>
          <div className="stat-value">{stats.users}</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-title">Đơn hàng</div>
          <div className="stat-value">{stats.orders}</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-title">Doanh thu</div>
          <div className="stat-value">{stats.revenue.toLocaleString()} đ</div>
        </div>
      </div>
      <div className="dashboard-main-row">
        <div className="dashboard-main-col">
          <h3>Khóa học mới nhất</h3>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Tên khóa học</th>
                <th>Loại</th>
                <th>Giá</th>
              </tr>
            </thead>
            <tbody>
              {recentCourses.map((c) => (
                <tr key={c._id}>
                  <td>{c.title}</td>
                  <td>{c.courseType}</td>
                  <td>{c.price?.toLocaleString()} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dashboard-main-col">
          <h3>Đơn hàng mới nhất</h3>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Khóa học</th>
                <th>Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, idx) => (
                <tr key={idx}>
                  <td>{o.userId?.name || o.userId?.email || "-"}</td>
                  <td>{o.courseId?.title}</td>
                  <td>{o.paymentDetails?.amount?.toLocaleString()} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dashboard-actions-row">
        <button className="dashboard-action-btn" onClick={() => window.location.href='/admin/courses'}>Quản lý khóa học</button>
        <button className="dashboard-action-btn" onClick={() => window.location.href='/admin/orders'}>Quản lý đơn hàng</button>
        <button className="dashboard-action-btn" onClick={() => window.location.href='/admin/students'}>Quản lý người dùng</button>
        <button className="dashboard-action-btn" onClick={() => window.location.href='/admin/courses/new'}>Thêm khóa học mới</button>
      </div>
    </div>
  );
}

export default Dashboard;
