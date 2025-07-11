import React from 'react';
import '../Component.css';
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigateTo = useNavigate();
  const location = useLocation(); // 👉 lấy URL hiện tại

  // 👉 Hàm kiểm tra nếu URL hiện tại chứa đường dẫn cần active
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src="/logo.png" alt="Logo" className="logo-img" />
      </div>
      <ul className="nav-menu">
        <li onClick={() => navigateTo("/admin")} className={isActive("/admin") && !isActive("/admin/students") && !isActive("/admin/courses") ? "active" : ""}>
          <i className="fas fa-home"></i>
          <span>Thống kê</span>
        </li>
        <li onClick={() => navigateTo("/admin/students")} className={isActive("/admin/students") ? "active" : ""}>
          <i className="fas fa-user"></i>
          <span>Tài khoản</span>
        </li>
        <li onClick={() => navigateTo("/admin/courses")} className={isActive("/admin/courses") ? "active" : ""}>
          <i className="fas fa-book"></i>
          <span>Khóa học</span>
        </li>
        <li onClick={() => navigateTo("/admin/orders")} className={isActive("/admin/orders") ? "active" : ""}>
          <i className="fas fa-shopping-cart"></i>
          <span>Đơn hàng</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
