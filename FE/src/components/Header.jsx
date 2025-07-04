import '../Component.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

 const handleLogout = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      "http://localhost:4000/api/v1/users/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true, // nếu server cần cookie
      }
    );

    localStorage.removeItem("token");
    toast.success("Đăng xuất thành công!");
    window.location.href = "/login";
  } catch (error) {
    console.error("Lỗi đăng xuất:", error.message);
    toast.error("Đăng xuất thất bại!");
  }
};


  return (
    <div className="dashboard-header">
      <div className="search-notify">

        {/* Avatar + Dropdown */}
        <div className="avatar-wrapper" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img src="/avatar2.jpg" alt="avatar" className="avatar-image" />
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
