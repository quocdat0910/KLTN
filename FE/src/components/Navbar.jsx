import '../main.css';
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { Context } from "../main";
import axios from "axios";
import { toast } from "react-toastify";

const Navbar = () => {
  const { isAuthenticated, setIsAuthenticated, setUser, user } = useContext(Context);
  const navigate = useNavigate();

  const handleSelect = (category) => {
    console.log("Bạn đã chọn:", category);
    // Ví dụ: chuyển trang hoặc filter nội dung theo danh mục
  };

  const handleLogout = async () => {
    try {
      const res = await axios.post("http://localhost:4000/api/v1/users/logout", {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      toast.success(res.data.message);
      setIsAuthenticated(false);
      setUser({});
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng xuất thất bại");
    }
  };

  return (
    <>
      {/* Bottom white navbar */}
      <div className="navbar-bottom">
        <img onClick={() => navigate("/")} className="logo" src="logo.png" alt="Logo" />
        <div className="discovery-button">
          <div className="discovery-button-hover-area">
            <div className="discovery-button-inner">
              <span>Khám phá</span>
              <div className="discovery-arrow"></div>
            </div>
            <div className="discovery-menu">
              <ul>
                <li onClick={() => handleSelect('Toeic')}>Toeic</li>
                <li onClick={() => handleSelect('Ielts')}>Ielts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="search-box">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Bạn muốn học gì ?" 
          />
          <div className="search-icon">
            <img src="search.png" alt="Search" />
          </div>
        </div>

        <div className="nav-link link-degree" onClick={() => navigate("/aboutus")}>Giới thiệu</div>
        <div className="nav-link link-career" onClick={() => navigate("/contactus")}>Liên hệ</div>
        
        {isAuthenticated ? (
          <div className="user-section">
            <span className="user-greeting">Xin chào, {user.fullName || "Người dùng"}</span>
            <div className="nav-link link-logout" onClick={handleLogout}>Đăng xuất</div>
          </div>
        ) : (
          <>
            <div className="nav-link link-login" onClick={() => navigate("/login")}>Đăng nhập</div>
            <div className="register-button" onClick={() => navigate("/register")}>
              <span>Tham gia miễn phí</span>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;