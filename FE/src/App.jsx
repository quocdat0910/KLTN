import "./App.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import AboutUs from "./pages/AboutUs";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ContactUs from "./pages/ContactUs.jsx";
import Account from "./pages/Account.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import { useEffect } from "react";

const Layout = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/myaccount" element={<Account />} />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <Layout />
      <ToastContainer position="top-center" />
    </Router>
  );
};

export default App;
