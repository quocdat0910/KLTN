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
import MyCourse from "./pages/MyCourse";
import PracticeTest from "./pages/PracticeTest";
import TestPage from "./components/TestPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
{/* Các Route dành cho Admin Layout */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/categories" element={<Category />} />

          {/* Các Route quản lý Khóa học */}
          <Route path="/admin/courses" element={<Course />} />
          <Route path="/admin/courses/new" element={<AddCourse />} />
          <Route path="/admin/courses/:id" element={<AddCourse />} /> 
          <Route path="/admin/courses/:courseId/chapters/new" element={<AddChapter />} />
          <Route path="/admin/courses/:courseId/chapters/:chapterId" element={<AddChapter />} />

          {/* Thêm các Route dành riêng cho admin khác tại đây */}
        </Route>

        {/* User Layout Routes  */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/myaccount" element={<Account />} />
          <Route path="/mycourse" element={<MyCourse />} />
          <Route path="/testpage" element={<TestPage />} />
          <Route path="/practicetest" element={<PracticeTest />} />
          <Route path="/productcat" element={<ProductCat />} />
          <Route path="/course/:id" element={<ProductDetail />} />4
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
