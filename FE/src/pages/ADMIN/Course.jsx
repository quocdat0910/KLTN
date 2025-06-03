import '../../Component.css';
import React, { useState } from 'react';
import { FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import { Link, useNavigate, Navigate } from "react-router-dom";

const Course = () => {

  const navigateTo = useNavigate();

const [users, setUsers] = useState([
  {
    id: 1,
    course: "TOEIC 600+",
    description: "...",
    price: 600000,
  },
]);

    return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className='h2'>Khóa học</h2>
      </div>

      <div className="search-add">
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm" />
          <FaSearch className="search-icon" />
        </div>
        <button onClick={() => navigateTo("addCourse")} className="add-btn">Thêm khóa học</button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Khóa học</th>
            <th>Mô tả</th>
            <th>Giá</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={u.id}>
              <td>{index + 1}</td>
              <td>{u.course}</td>
            <td>{u.description}</td>
              <td>{u.price}</td>
              <td className="action-icons">
                <FaEdit className="icon edit" />
                <FaTrash className="icon delete" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <span className="prev">&lt; Previous</span>
        <span className="page active">1</span>
        <span className="page">2</span>
        <span className="page">3</span>
        <span className="page">4</span>
        <span className="next">Next &gt;</span>
      </div>
    </div>
    )
}
export default Course;