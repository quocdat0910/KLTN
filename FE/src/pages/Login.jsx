import axios from "axios";
import "../main.css"; 
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const Login = () => {
  const { isAuthenticated, setIsAuthenticated, setUser, user } = useContext(Context);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigateTo = useNavigate();
  const [searchParams] = useSearchParams();

  // Xử lý query parameter để hiển thị thông báo
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "verified") {
      toast.success("Xác thực tài khoản thành công", { toastId: "verify-success" });
    }
    if (error) {
      toast.error(decodeURIComponent(error), { toastId: "verify-error" });
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return; // Ngăn chặn nhiều lần submit

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/users/login",
        { email, password }, // Không gửi role
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Login response:", res.data); // Debug
      toast.success(res.data.message, { toastId: "login-success" });
      setIsAuthenticated(true);
      const userData = res.data.user;
      const fullName = userData.fullName || `${userData.firstName} ${userData.lastName}`;
      setUser({ ...userData, fullName });

      // Chuyển hướng dựa trên role từ API
      if (userData.role === "admin") {
        window.location.href = "http://localhost:5174/"; // Dashboard admin
      } else {
        navigateTo("/"); // Home cho student
      }

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Đăng nhập thất bại", { toastId: "login-error" });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    // Chuyển hướng ngay nếu đã đăng nhập
    return user.role === "admin" ? (
      <Navigate to="http://localhost:5174/" replace />
    ) : (
      <Navigate to="/" replace />
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Left Side */}
        <div className="login-left">
          <h1>Học tiếng Anh mọi lúc mọi nơi</h1>
          <p>Hãy tham gia vào nền tảng của DA Course để cải thiện khả năng tiếng Anh của bạn mọi lúc mọi nơi.</p>
          <button className="btn-primary" onClick={() => navigateTo("/")}>Trang chủ</button>
        </div>

        {/* Right Side */}
        <div className="login-right">
          <h2>Đăng nhập</h2>

          <form onSubmit={handleLogin} className="login-form">
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@abc.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                disabled={loading}
              />
            </div>

            <div className="login-options">
              <label>
                <input type="checkbox" disabled={loading} />
                Nhớ mật khẩu
              </label>
              <Link to="/forgot-password" className="forgot-password-link">Quên mật khẩu?</Link>
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="login-register-link">
            <p>Bạn chưa đăng ký? <Link to="/register">Đăng ký ngay</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;