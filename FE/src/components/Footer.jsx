import { Link } from "react-router-dom";
import { FaLocationArrow, FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

const Footer = () => {
  const hours = [
    {
      id: 1,
      day: "Thứ Hai",
      time: "9:00 AM - 11:00 PM",
    },
    {
      id: 2,
      day: "Thứ Ba",
      time: "12:00 PM - 12:00 AM",
    },
    {
      id: 3,
      day: "Thứ Tư",
      time: "10:00 AM - 10:00 PM",
    },
    {
      id: 4,
      day: "Thứ Năm",
      time: "9:00 AM - 9:00 PM",
    },
    {
      id: 5,
      day: "Thứ Hai",
      time: "3:00 PM - 9:00 PM",
    },
    {
      id: 6,
      day: "Thứ Bảy",
      time: "9:00 AM - 3:00 PM",
    },
  ];

  return (
    <>
      <footer className={"container"}>
        <hr />
        <div className="content">
          <div>
            <img src="/Happy Teeth.png" alt="logo" className="logo-img"/>
          </div>
          <div>
            <h4>Truy cập nhanh</h4>
            <ul>
            <Link to={"/"}>Trang chủ</Link>
              <Link to={"/appointment"}>Lịch hẹn</Link>
              <Link to={"/about"}>Tiểu sử</Link>
            </ul>
          </div>
          <div>
            <h4>Giờ Làm Việc</h4>
            <ul>
              {hours.map((element) => (
                <li key={element.id}>
                  <span>{element.day}</span>
                  <span>{element.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Liên Lạc</h4>
            <div>
              <FaPhone />
              <span>0000-0000-0000</span>
            </div>
            <div>
              <MdEmail />
              <span>HT@gmail.com</span>
            </div>
            <div>
              <FaLocationArrow />
              <span>hocmon-TPHCM</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;