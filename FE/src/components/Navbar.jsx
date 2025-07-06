// src/components/Navbar.jsx
import '../main.css';
import { useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { Context } from "../main"; // Đảm bảo Context được import đúng
import axios from "axios";
import { toast } from "react-toastify";

const Navbar = () => {
    // Lấy isAuthenticated, setIsAuthenticated, user, setUser từ Context
    const { isAuthenticated, setIsAuthenticated, setUser, user } = useContext(Context);
    const navigate = useNavigate();

    // State để quản lý trạng thái mở/đóng của các dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false); // Dropdown người dùng
    const [discoverDropdownOpen, setDiscoverDropdownOpen] = useState(false); // Dropdown khám phá

    // Ref để phát hiện click bên ngoài dropdown người dùng, đóng dropdown khi click ra ngoài
    const dropdownRef = useRef(null);
    const discoverRef = useRef(null);

    // Ô tìm kiếm
    const [searchValue, setSearchValue] = useState("");
    const handleSearch = () => {
        if (searchValue.trim()) {
            navigate(`/search-results?q=${encodeURIComponent(searchValue.trim())}`);
        }
    };
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    // Hàm xử lý khi chọn một mục trong menu "Khám phá"
    const handleSelect = (category) => {
        // Chuyển hướng sang ProductCat với courseType phù hợp
        const type = category.toUpperCase();
        navigate(`/product-cat?courseType=${type}`);
        setDiscoverDropdownOpen(false); // Đóng dropdown sau khi chọn
    };

    // Hàm xử lý đăng xuất người dùng
    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:4000/api/v1/users/logout", {}, {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            });
            toast.success("Đăng xuất thành công");
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Nếu lỗi 401 thì vẫn coi là đăng xuất thành công
            } else {
                toast.error(error.response?.data?.message || "Đăng xuất thất bại");
            }
        }
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser({
            firstName: '',
            lastName: '',
            email: '',
            fullName: 'Người dùng',
            avatar: '/user.png'
        });
        setDropdownOpen(false);
        navigate("/login");
    };

    // Hàm điều hướng đến trang quản lý tài khoản
    const handleManageAccount = () => {
        navigate("/myaccount");
        setDropdownOpen(false); // Đóng dropdown người dùng
    };

    const handleManageCourse = () => {
        navigate("/mycourse");
        setDropdownOpen(false); // Đóng dropdown người dùng
    };

    // useEffect để xử lý click bên ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Nếu dropdown đang mở và click không phải bên trong dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            // Nếu discover dropdown đang mở và click không phải bên trong
            if (discoverRef.current && !discoverRef.current.contains(event.target)) {
                setDiscoverDropdownOpen(false);
            }
        };
        // Thêm event listener khi component mount
        document.addEventListener("mousedown", handleClickOutside);
        // Xóa event listener khi component unmount để tránh rò rỉ bộ nhớ
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []); // Dependency rỗng nghĩa là chỉ chạy một lần khi mount và cleanup khi unmount

    return (
        <div className="navbar-bottom">
            {/* Logo, click để về trang chủ */}
            <img
                onClick={() => navigate("/")}
                className="logo"
                src="/logo.png"
                alt="Logo"
            />

            {/* Nút "Khám phá" với dropdown menu */}
            <div 
                className="discovery-button" 
                ref={discoverRef}
                onMouseEnter={() => setDiscoverDropdownOpen(true)}
                onMouseLeave={() => setDiscoverDropdownOpen(false)}
            >
                <div className="discovery-button-hover-area">
                    <div className="discovery-button-inner">
                        <span>Khám phá</span>
                        <div className="discovery-arrow"></div> {/* Mũi tên chỉ xuống */}
                    </div>
                    {/* Menu dropdown "Khám phá" */}
                    {discoverDropdownOpen && (
                        <div className="discovery-menu">
                            <ul>
                                <li onClick={() => handleSelect('TOEIC')}>TOEIC</li>
                                <li onClick={() => handleSelect('IELTS')}>IELTS</li>
                                {/* Thêm các mục khám phá khác ở đây */}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Ô tìm kiếm */}
            <div className="search-box">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Bạn muốn học gì ?"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                />
                <div className="search-icon" onClick={handleSearch} style={{ cursor: 'pointer' }}>
                    <img src="/search.png" alt="Search" />
                </div>
            </div>

            {/* Các liên kết điều hướng tĩnh */}
            <div className="nav-link link-test" onClick={() => navigate("/practicetest")}>Thi thử</div>
            <div className="nav-link link-degree" onClick={() => navigate("/aboutus")}>Giới thiệu</div>
            <div className="nav-link link-career" onClick={() => navigate("/contactus")}>Liên hệ</div>

            {/* Phần hiển thị thông tin người dùng hoặc nút đăng nhập/đăng ký */}
            {isAuthenticated ? (
                // Nếu đã đăng nhập, hiển thị avatar và tên người dùng với dropdown
                <div className="user-dropdown" ref={dropdownRef}>
                    <div className="user-info-display" onClick={() => setDropdownOpen(!dropdownOpen)}>
                       <img
                        src={user?.avatar || "/user.png"} // fallback nếu avatar bị thiếu
                        alt="Avatar"
                        className="navbar-avatar"
                        />
                        <span className="user-name">{user?.fullName || "Người dùng"} ▼</span>
                    </div>
                    {/* Menu dropdown khi click vào avatar/tên người dùng */}
                    {dropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item" onClick={handleManageAccount}>Quản lý tài khoản</div>
                            <div className="dropdown-item" onClick={handleLogout}>Đăng xuất</div>
                            <div className="dropdown-item" onClick={handleManageCourse}>Khóa học của tôi</div>
                        </div>
                    )}
                </div>
            ) : (
                // Nếu chưa đăng nhập, hiển thị nút đăng nhập và đăng ký
                <>
                    <div className="nav-link link-login" onClick={() => navigate("/login")}>Đăng nhập</div>
                    <div className="register-button" onClick={() => navigate("/register")}>
                        <span>Tham gia miễn phí</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default Navbar;