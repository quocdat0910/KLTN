import { Link } from "react-router-dom";
import { FaLocationArrow, FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import "../main.css"; // Đừng quên import CSS

const Footer = () => {
  const hours = [
    { id: 1, day: "Thứ Hai", time: "9:00 AM - 11:00 PM" },
    { id: 2, day: "Thứ Ba", time: "12:00 PM - 12:00 AM" },
    { id: 3, day: "Thứ Tư", time: "10:00 AM - 10:00 PM" },
    { id: 4, day: "Thứ Năm", time: "9:00 AM - 9:00 PM" },
    { id: 5, day: "Thứ Sáu", time: "3:00 PM - 9:00 PM" },
    { id: 6, day: "Thứ Bảy", time: "9:00 AM - 3:00 PM" },
  ];

  return (
    <footer>
      <hr />
      <div className="content">
        {/* Logo */}
        <div>
          <img src="/logo.png" alt="logo" className="logo-img" />
          <p className="desc">Learn English the fun way with us!</p>
        </div>

        {/* Quick Links */}
        <div>
          <h4>Truy cập nhanh</h4>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/appointment">Lịch hẹn</Link></li>
            <li><Link to="/about">Giới thiệu</Link></li>
          </ul>
        </div>

        {/* Working Hours */}
        <div>
          <h4>Giờ Làm Việc</h4>
          <ul>
            {hours.map(({ id, day, time }) => (
              <li key={id}>
                <span>{day}</span>
                <span>{time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="contact">
          <h4>Liên hệ</h4>
          <div><FaPhone /><span>(+84) 0000-0000</span></div>
          <div><MdEmail /><span>contact@englishhub.com</span></div>
          <div><FaLocationArrow /><span>Hóc Môn, TP. Hồ Chí Minh</span></div>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="bottom">
        © {new Date().getFullYear()} English Hub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
