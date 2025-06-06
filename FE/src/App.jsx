import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";
import HomeworkLayout from "./layouts/HomeworkLayout";

import Dashboard from "./pages/ADMIN/Dashboard";
import Roles from "./pages/ADMIN/Roles";
import Students from "./pages/ADMIN/Students";
import Category from "./pages/ADMIN/Category";
import Course from "./pages/ADMIN/Course";
import AddCourse from "./pages/ADMIN/AddCourse";
import AddChapter from "./pages/ADMIN/AddChapter";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Account from "./pages/Account";
import ProductCat from "./pages/ProductCat";
import ProductDetail from "./pages/ProductDetail";
import Homework from "./pages/Homework";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Layout Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/categories" element={<Category />} />
          <Route path="/admin/course" element={<Course />} />
          <Route path="/admin/course/addCourse" element={<AddCourse />} />
          <Route path="/admin/course/addCourse/addChapter" element={<AddChapter />} />
        </Route>

        {/* User Layout Routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/myaccount" element={<Account />} />
          <Route path="/productcat" element={<ProductCat />} />
          <Route path="/productdetail" element={<ProductDetail />} />
        </Route>

            {/* Homework Layout Routes */}
        <Route element={<HomeworkLayout />}>
        <Route path="/homework" element={<Homework />} />
        </Route>
      </Routes>

      

      <ToastContainer position="top-center" />
    </Router>
  );
};

export default App;
