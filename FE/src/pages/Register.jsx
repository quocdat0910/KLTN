import "../main.css";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

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
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác minh.");
      setShowVerificationNotice(true);
      setLoading(false);

      // 🔁 Giả lập xác minh thành công sau 5 giây
      setTimeout(() => {
        setVerificationSuccess(true);
        toast.success("Xác minh email thành công!");
        setTimeout(() => {
          navigate("/login");
        }, 2000); // Chuyển hướng sau khi xác minh
      }, 5000);
    }, 1500);
  };

  const handleResendVerification = () => {
    setResending(true);
    setTimeout(() => {
      toast.success("Đã gửi lại email xác minh!");
      setResending(false);
    }, 1000);
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
                  value="Nam"
                  onChange={(e) => setGender(e.target.value)}
                />{" "}
                Nam
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Nữ"
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
      {showVerificationNotice && !verificationSuccess && (
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

      {/* Popup xác minh thành công */}
      {verificationSuccess && (
        <div className="overlay">
          <div className="popup">
            <p className="success-message">
               Xác minh thành công! Đang chuyển đến trang đăng nhập...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
