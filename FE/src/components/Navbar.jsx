import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isAuthenticated, setIsAuthenticated, user } = useContext(Context);

  const handleLogout = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/user/patient/logout", {
        withCredentials: true,
      });
      toast.success(res.data.message);
      setIsAuthenticated(false);
      goToLogin();
    } catch (err) {
      toast.error(err.response.data.message);
    }
  };

  const navigateTo = useNavigate();

  const goToLogin = () => {
    navigateTo("/login");
  };

  return (
    <>
      <nav className={"container"}>
        <div className="logo">
          <img src="/Happy Teeth.png" alt="logo" className="logo-img" />
        </div>
        <div className={show ? "navLinks showmenu" : "navLinks"}>
          <div className="links">
            <Link to={"/"} onClick={() => setShow(!show)}>
              Trang chủ
            </Link>
            <Link to={"/appointment"} onClick={() => setShow(!show)}>
              Lịch hẹn
            </Link>
            <Link to={"/about"} onClick={() => setShow(!show)}>
              Tiểu sử
            </Link>
          </div>
          {isAuthenticated && user ? (
            <div className="user-info" 
              onMouseEnter={() => setDropdownOpen(true)} 
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <span className="user-name">{`${user.firstName} ${user.lastName}`}</span>
              {dropdownOpen && (
                <div className="dropdown">
                  <Link to="/appointmentstatus" onClick={() => setShow(!show)}>
                    Trạng thái lịch hẹn
                  </Link>
                  <Link to="/profile" onClick={() => setShow(!show)}>
                    Thông tin cá nhân
                  </Link>
                  <Link to="/medical-record" onClick={() => setShow(!show)}>
                    Lịch sử khám bệnh
                  </Link>
                  <button className="logoutBtn btn" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="loginBtn btn" onClick={goToLogin}>
              Đăng nhập
            </button>
          )}
        </div>
        <div className="hamburger" onClick={() => setShow(!show)}>
          <GiHamburgerMenu />
        </div>
      </nav>
    </>
  );
};

export default Navbar;