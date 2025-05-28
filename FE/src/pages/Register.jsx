import "../main.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:4000/api/v1/users/register`,
        {
          email,
          password,
          confirmPassword,
          firstName,
          lastName,
          dateOfBirth: dob,
          gender,
          phone,
        }
      );

      toast.success(response.data.message);
      setShowVerificationNotice(true);
    } catch (error) {
      const message =
        error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);

    try {
      const response = await axios.post(
        `http://localhost:4000/api/v1/users/request-verification`,
        { email }
      );
      toast.success(response.data.message);
    } catch (error) {
      const message =
        error.response?.data?.message || "Gửi lại email xác minh thất bại";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">
        <div className="register-left">
          <img
            src="register.jpg"
            alt="Register Illustration"
            className="register-illustration"
          />
          <h1>Đăng ký ngay</h1>
          <p>Đăng ký tài khoản để bắt đầu học Tiếng Anh mọi lúc mọi nơi.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>
            Trang chủ
          </button>
        </div>

        <div className="register-right">
          <form onSubmit={handleRegister} className="register-form">
            <h2>Đăng ký</h2>

            <label>Email</label>
            <input
              type="email"
              required
              placeholder="mail@abc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Họ</label>
            <input
              type="text"
              required
              placeholder="Nguyễn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <label>Tên</label>
            <input
              type="text"
              required
              placeholder="Văn A"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <label>Số điện thoại</label>
            <input
              type="tel"
              required
              placeholder="0123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label>Ngày sinh</label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />

            <label>Giới tính</label>
            <div className="gender-options">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === "male"}
                  onChange={(e) => setGender(e.target.value)}
                />{" "}
                Nam
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === "female"}
                  onChange={(e) => setGender(e.target.value)}
                />{" "}
                Nữ
              </label>
            </div>

            <label>Mật khẩu</label>
            <input
              type="password"
              required
              placeholder="*********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              placeholder="*********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="social-register">
            <p>Hoặc đăng ký với</p>
            <div className="social-buttons">
              <button
                onClick={() => toast.info("Chưa hỗ trợ Google")}
                className="btn-google"
              >
                Google
              </button>
              <button
                onClick={() => toast.info("Chưa hỗ trợ Facebook")}
                className="btn-facebook"
              >
                Facebook
              </button>
            </div>
          </div>

          <div className="register-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>

      {/* Overlay Xác minh Email */}
      {showVerificationNotice && (
        <div className="overlay">
          <div className="popup">
            <p className="success-message">
              Chúng tôi đã gửi email xác minh đến <strong>{email}</strong>.
            </p>
            <p>Chưa nhận được email?</p>
            <div className="button-row">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="btn-resend"
              >
                {resending ? "Đang gửi lại..." : "Gửi lại email xác minh"}
              </button>
              <button
                onClick={() => setShowVerificationNotice(false)}
                className="btn-cancel"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;