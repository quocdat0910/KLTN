// src/main.jsx
import React, { createContext, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import axios from "axios";

// Tạo Context
export const Context = createContext({
  isAuthenticated: false,
  user: {},
  fetchUserProfile: async () => {}, // 👉 Thêm hàm vào Context
});

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    fullName: 'Người dùng',
    avatar: '/user.png',
  });

  // 👉 Hàm dùng để fetch thông tin người dùng sau login hoặc reload
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser({
        firstName: '',
        lastName: '',
        email: '',
        fullName: 'Người dùng',
        avatar: '/user.png'
      });
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

    } catch (error) {
      console.error("Failed to fetch user profile:", error.message);
      setIsAuthenticated(false);
      setUser({
        firstName: '',
        lastName: '',
        email: '',
        fullName: 'Người dùng',
        avatar: '/user.png'
      });
      localStorage.removeItem("token");
    }
  };

  // Chạy 1 lần khi app khởi động
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
        fetchUserProfile, // 👉 Truyền vào Context
      }}
    >
      <App />
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
