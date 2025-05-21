import React from 'react';
import '../Component.css';
import { Link, useNavigate, Navigate } from "react-router-dom";

const Sidebar = () => {
  const navigateTo = useNavigate();
  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src="logo.png" alt="Logo" className="logo-img" />
      </div>
      <ul className="nav-menu">
        <li onClick={() => navigateTo("/")} className="active">
          <i className="fas fa-home"></i>
          <span>Thống kê</span>
        </li>
        <li onClick={() => navigateTo("/students")}>
          <i className="fas fa-user"></i>
          <span>Khách hàng</span>
        </li>
        <li onClick={() => navigateTo("/teachers")}>
          <i className="fas fa-chalkboard-teacher"></i>
          <span>Giáo viên</span>
        </li>
        <li onClick={() => navigateTo("/subjects")}>
          <i className="fas fa-book"></i>
          <span>Môn học</span>
        </li>
         <li onClick={() => navigateTo("/roles")}>
          <i className="fas fa-user-tag"></i>
          <span>Vai trò</span> 
        </li>
        <li onClick={() => navigateTo("/setting")}>
          <i className="fas fa-cog"></i>
          <span>Cài đặt</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
