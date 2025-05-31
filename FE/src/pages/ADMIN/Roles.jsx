import '../../Component.css';
import React, { useState } from 'react';
import CreateRoleForm from '../../components/CreateRoleForm';
import { FaTrash, FaEdit, FaSearch } from "react-icons/fa";

const Roles = () => {
  const [showForm, setShowForm] = useState(false);
const handleStatusToggle = (index) => {
  const updatedUsers = [...users];
  updatedUsers[index].status = !updatedUsers[index].status;
  setUsers(updatedUsers);
};


const [users, setUsers] = useState([
  {
    id: 1,
    role: "Khách hàng",
    status: true,
    action: "Là học viên của DA Course",
  },
]);

    return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className='h2'>Vai trò</h2>
      </div>

      <div className="search-add">
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm" />
          <FaSearch className="search-icon" />
        </div>
        <button className="add-btn" onClick={() => setShowForm(true)}>Thêm vai trò</button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Vai trò</th>
            <th>Status</th>
            <th>Mô tả</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={u.id}>
              <td>{index + 1}</td>
              <td>{u.role}</td>
             <td>
  <label className="switch">
    <input
      type="checkbox"
      checked={u.status}
      onChange={() => handleStatusToggle(index)}
    />
    <span className="slider round"></span>
  </label>
</td>

              <td>{u.action}</td>
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
      {showForm && <CreateRoleForm onClose={() => setShowForm(false)} />}
    </div>
    )
}
export default Roles;