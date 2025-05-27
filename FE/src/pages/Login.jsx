import axios from "axios";
import "../main.css"; 
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Link, useNavigate, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Login = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigateTo = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        { email, password, role: "Bệnh nhân" },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(res.data.message);
      setIsAuthenticated(true);
      const userData = res.data.user;
      const fullName = userData.fullName || `${userData.firstName} ${userData.lastName}`;
      setUser({ ...userData, fullName });
      navigateTo("/");
      setEmail("");
      setPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/" />;

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Left Side */}
        <div className="login-left">
          <h1>Học tiếng anh mọi lúc mọi nơi</h1>
          <p>Hãy tham gia vào nền tảng của DA Course để cải thiện khả năng tiếng anh của bạn mọi lúc mọi nơi.</p>
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
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="***************"
              />
            </div>

            <div className="login-options">
              <label>
                <input type="checkbox" />
                Nhớ mật khẩu
              </label>
              <Link to="/forgot-password" className="forgot-password-link">Quên mật khẩu?</Link>
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-register-link">
            Bạn chưa đăng ký? <Link to="/register">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
