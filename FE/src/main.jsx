// src/main.jsx
import React, { createContext, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import axios from "axios";
import { ToastContainer } from "react-toastify"; // Đảm bảo đã import ToastContainer và styles
import 'react-toastify/dist/ReactToastify.css';

// Tạo Context
export const Context = createContext({
  isAuthenticated: false,
  user: null, // Đổi thành null để dễ kiểm tra trạng thái chưa có user
  loading: true, // 👉 Thêm loading state vào Context
  setIsAuthenticated: () => {},
  setUser: () => {},
  setLoading: () => {}, // 👉 Thêm setter cho loading
  fetchUserProfile: async () => {},
});

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // 👉 Khởi tạo loading là true
  const [user, setUser] = useState(null); // 👉 Khởi tạo user là null

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null); // Đặt user về null nếu không có token
      setLoading(false); // 👉 Kết thúc loading vì không có token
      return;
    }

    try {
      const res = await axios.get("http://localhost:4000/api/v1/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      setIsAuthenticated(true);
      const userData = res.data.user;
      const fullName =
        userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.firstName || userData.lastName || userData.email || "Người dùng";

      setUser({
        ...userData,
        fullName,
        avatar: userData.avatar || "/user.png",
      });
      setLoading(false); // 👉 Kết thúc loading sau khi fetch thành công

    } catch (error) {
      console.error("Failed to fetch user profile:", error.message);
      setIsAuthenticated(false);
      setUser(null); // Đặt user về null nếu lỗi
      localStorage.removeItem("token");
      setLoading(false); // 👉 Kết thúc loading sau khi fetch thất bại
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <Context.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        loading, // 👉 Cung cấp loading state qua Context
        setLoading, // 👉 Cung cấp setter cho loading
        fetchUserProfile,
      }}
    >
      <App />
      <ToastContainer position="bottom-right" theme="dark" /> {/* Đảm bảo ToastContainer được render */}
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);