import axios from "axios";
import "../main.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if(password !== confirmPassword){
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/register",
        { email, fullName, phone, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(res.data.message);
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // TODO: Thêm logic đăng nhập với Google (ví dụ redirect OAuth)
    toast.info("Chức năng đăng ký bằng Google chưa được hỗ trợ.");
  };

  const handleFacebookRegister = () => {
    // TODO: Thêm logic đăng nhập với Facebook
    toast.info("Chức năng đăng ký bằng Facebook chưa được hỗ trợ.");
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">
        {/* Left side */}
        <div className="register-left">
          <h1>Join Us Now</h1>
          <p>Register to start learning English anytime, anywhere.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>Go to Home</button>
        </div>

        {/* Right side */}
        <div className="register-right">
          <h2>Register your account</h2>
          <form onSubmit={handleRegister} className="register-form">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="mail@abc.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <label>Họ và Tên</label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />

            <label>Số điện thoại</label>
            <input
              type="tel"
              required
              placeholder="0123456789"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />

            <label>Mật khẩu</label>
            <input
              type="password"
              required
              placeholder="*********"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              placeholder="*********"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="social-register">
            <p>Or register with</p>
            <div className="social-buttons">
              <button onClick={handleGoogleRegister} className="btn-google">Google</button>
              <button onClick={handleFacebookRegister} className="btn-facebook">Facebook</button>
            </div>
          </div>

          <div className="register-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
