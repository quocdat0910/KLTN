import React from 'react';
import '../Component.css';
import { Link, useNavigate, Navigate } from "react-router-dom";

const Sidebar = () => {
  const navigateTo = useNavigate();
  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src="/logo.png" alt="Logo" className="logo-img" />
      </div>
      <ul className="nav-menu">
        <li onClick={() => navigateTo("admin/")} className="active">
          <i className="fas fa-home"></i>
          <span>Thống kê</span>
        </li>
        <li onClick={() => navigateTo("admin/students")}>
          <i className="fas fa-user"></i>
          <span>Tài khoản</span>
        </li>
        <li onClick={() => navigateTo("admin/courses")}>
          <i className="fas fa-book"></i>
          <span>Khóa học</span>
        </li>
         {/* <li onClick={() => navigateTo("admin/roles")}>
          <i className="fas fa-user-tag"></i>
          <span>Vai trò</span> 
        </li> */}
        <li onClick={() => navigateTo("admin/categories")}>
          <i className="fas fa-list"></i>
          <span>Danh mục</span>
        </li>

        {/* <li onClick={() => navigateTo("admin/setting")}>
          <i className="fas fa-cog"></i>
          <span>Cài đặt</span>
        </li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
