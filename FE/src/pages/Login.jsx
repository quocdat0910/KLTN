import axios from "axios";
import "../main.css";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";

const Login = () => {
  const { isAuthenticated, setIsAuthenticated, setUser, user } = useContext(Context);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Xử lý thông báo từ query params (sau xác minh email)
  useEffect(() => {
    const success = params.get("success");
    const error = params.get("error");

    if (success === "verified") toast.success("Xác thực tài khoản thành công", { toastId: "verify-success" });
    if (error) toast.error(decodeURIComponent(error), { toastId: "verify-error" });
  }, [params]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/v1/users/login",
        { email, password },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      const userData = res.data.user;
      const fullName = userData.fullName || `${userData.firstName} ${userData.lastName}`;

      toast.success(res.data.message, { toastId: "login-success" });
      setUser({ ...userData, fullName });
      setIsAuthenticated(true);

      // Lưu token vào localStorage
      if (res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
      }

      // Điều hướng theo vai trò
      navigate(userData.role === "admin" ? "/admin" : "/");

      // Reset form
      setEmail("");
      setPassword("");
    } catch (err) {
      const message = err.response?.data?.message || "Đăng nhập thất bại";
      toast.error(message, { toastId: "login-error" });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }

  return (
    <div className="login-container">
      <div className="login-box">

        {/* Trái */}
        <div className="login-left">
          <h1>Học tiếng Anh mọi lúc mọi nơi</h1>
          <p>Tham gia nền tảng DA Course để cải thiện khả năng tiếng Anh của bạn.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>Trang chủ</button>
        </div>

        {/* Phải */}
        <div className="login-right">
          <h2>Đăng nhập</h2>

          <form onSubmit={handleLogin} className="login-form">
            <FormInput label="Email" type="email" value={email} setValue={setEmail} loading={loading} />
            <FormInput label="Mật khẩu" type="password" value={password} setValue={setPassword} loading={loading} />

            <div className="login-options">
              <label><input type="checkbox" disabled={loading} /> Nhớ mật khẩu</label>
              <Link to="/forgot-password" className="forgot-password-link">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="login-register-link">
            Bạn chưa đăng ký? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

// 👉 Component con cho input, tránh lặp
const FormInput = ({ label, type, value, setValue, loading }) => (
  <div>
    <label htmlFor={label}>{label}</label>
    <input
      type={type}
      id={label}
      value={value}
      required
      placeholder={type === "email" ? "mail@abc.com" : "********"}
      disabled={loading}
      onChange={(e) => setValue(e.target.value)}
    />
  </div>
);

export default Login;
