import '../main.css';
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {

  const navigate = useNavigate();

  const handleSelect = (category) => {
  console.log("Bạn đã chọn:", category);
  // Ví dụ: chuyển trang hoặc filter nội dung theo danh mục
};

  return (
    <>
      {/* Bottom white navbar */}
      <div className="navbar-bottom">
        <img className="logo" src="logo.png" alt="Logo" />
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


        <div className="nav-link link-degree">Giới thiệu</div>
        <div className="nav-link link-career">Liên hệ</div>
        <div className="nav-link link-login"  onClick={() => navigate("/login")}>Đăng nhập</div>

        <div className="register-button">
          <span>Tham gia miễn phí</span>
        </div>
      </div>
    </>
  );
};

export default Navbar;
