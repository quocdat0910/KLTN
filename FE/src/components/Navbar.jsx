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
      {/* Top black navbar */}
      <div className="navbar-top">
        <div className="menu-item item-personal">Dành cho cá nhân</div>
        <div className="menu-item item-business">Dành cho doanh nghiệp</div>
        <div className="menu-item item-university">Dành cho trường đại học</div>
        <div className="menu-item item-government">Dành cho chính phủ</div>
      </div>
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


        <div className="nav-link link-degree">Bằng cấp trực tuyến</div>
        <div className="nav-link link-career">Nghề nghiệp</div>
        <div className="nav-link link-login"  onClick={() => navigate("/login")}>Đăng nhập</div>

        <div className="register-button">
          <span>Tham gia miễn phí</span>
        </div>
      </div>
    </>
  );
};

export default Navbar;
