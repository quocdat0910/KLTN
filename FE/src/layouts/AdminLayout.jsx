import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import '../App.css'

const AdminLayout = () => {
  return (
    <>
      <Header />
      <Sidebar />
      <div style={{ marginLeft: "80px", padding: "2rem" }}>
        <Outlet />
      </div>
    </>
  );
};

export default AdminLayout;
