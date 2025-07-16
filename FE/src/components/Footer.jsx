import { Link } from "react-router-dom";
import { FaLocationArrow, FaPhone, FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import "../main.css";

const Footer = () => {
  const hours = [
    { id: 1, day: "Thứ Hai", time: "9:00 - 21:00" },
    { id: 2, day: "Thứ Ba", time: "9:00 - 21:00" },
    { id: 3, day: "Thứ Tư", time: "9:00 - 21:00" },
    { id: 4, day: "Thứ Năm", time: "9:00 - 21:00" },
    { id: 5, day: "Thứ Sáu", time: "9:00 - 21:00" },
    { id: 6, day: "Thứ Bảy", time: "9:00 - 17:00" },
  ];

  return (
    <footer style={{
      background: "linear-gradient(90deg, #ffffff 0%, #ffffff 100%)",
      padding: "38px 0 0 0",
      boxShadow: "0 -2px 16px rgba(0,0,0,0.04)",
    }}>
      <div className="footer-content" style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        maxWidth: 1300,
        margin: "0 auto",
        padding: "0 32px 32px 32px",
        gap: 32,
      }}>
        {/* Logo & Slogan */}
        <div style={{flex: "1 1 100px", minWidth: 100}}>
          <img src="/logo.png" alt="logo" style={{width: 150, height: 150, objectFit: "contain", marginBottom: 1}} />
          <div style={{fontWeight: 700, fontSize: 22, color: "#1a237e", marginBottom: 8}}>English Hub</div>
          <p style={{color: "#333", fontSize: 15, marginBottom: 16}}>Learn English the fun way with us!</p>
          <div style={{display: "flex", gap: 1}}>
            <a href="#" aria-label="Facebook" style={{color: "#1877f3", fontSize: 22,marginLeft: 48}}><FaFacebookF /></a>
            <a href="#" aria-label="YouTube" style={{color: "#ff0000", fontSize: 22,marginLeft:48}}><FaYoutube /></a>
            <a href="#" aria-label="Instagram" style={{color: "#e4405f", fontSize: 22,marginLeft: 48}}><FaInstagram /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{flex: "1 1 180px", minWidth: 170}}>
          <div style={{fontWeight: 600, fontSize: 17, marginBottom: 12,marginRight: 178, color: "#1a237e"}}>Truy cập nhanh</div>
          <ul style={{listStyle: "none", padding: 0, margin: 0, color: "#333", fontSize: 15}}>
            <li style={{marginBottom: 8}}><Link to="/">Trang chủ</Link></li>
            <li style={{marginBottom: 8}}><Link to="/contactus">Liên hệ</Link></li>
            <li style={{marginBottom: 8}}><Link to="/aboutus">Giới thiệu</Link></li>
          </ul>
        </div>

        {/* Working Hours */}
        <div style={{flex: "1 1 200px", minWidth: 170}}>
          <div style={{fontWeight: 600, fontSize: 17, marginBottom: 12, color: "#1a237e"}}>Giờ làm việc</div>
          <ul style={{listStyle: "none", padding: 0, margin: 0, color: "#333", fontSize: 15}}>
            {hours.map(({ id, day, time }) => (
              <li key={id} style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
                <span>{day}</span>
                <span>{time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div style={{flex: "1 1 220px", minWidth: 180}}>
          <div style={{fontWeight: 600, fontSize: 17, marginBottom: 12, color: "#1a237e"}}>Liên hệ</div>
          <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 8,marginLeft: 128}}><FaPhone /><span>(+84) 0000-0000</span></div>
          <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 8,marginLeft: 128}}><MdEmail /><span>contact@englishhub.com</span></div>
          <div style={{display: "flex", alignItems: "center", gap: 8,marginLeft: 128}}><FaLocationArrow /><span>Hóc Môn, TP. Hồ Chí Minh</span></div>
        </div>
      </div>
      {/* Bottom Line */}
      <div style={{textAlign: "center", color: "#888", fontSize: 15, padding: "16px 0 8px 0"}}>
        © {new Date().getFullYear()} English Hub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
