import { useState } from 'react';
import '../../Component.css';
import { FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import CreateAccountForm from '../../components/CreateAccountForm';

const Students = () => {
  const [showForm, setShowForm] = useState(false);

  const users = [
    {
      id: 1,
      name: "Nguyen Quoc Dat",
      email: "dat@gmail.com",
      phone: "0902660951",
      type: "Khách hàng",
      country: "Ho Chi Minh",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className='h2'>Khách hàng</h2>
      </div>

      <div className="search-add">
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm" />
          <FaSearch className="search-icon" />
        </div>
        <button className="add-btn" onClick={() => setShowForm(true)}>Thêm tài khoản</button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Họ và tên</th>
            <th>Email</th>
            <th>SDT</th>
            <th>Vai trò</th>
            <th>Địa chỉ</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={u.id}>
              <td>{index + 1}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.type}</td>
              <td>{u.country}</td>
              <td className="action-icons">
                <FaEdit className="icon edit" />
                <FaTrash className="icon delete" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <span className="prev">&lt; Trước</span>
        <span className="page active">1</span>
        <span className="page">2</span>
        <span className="page">3</span>
        <span className="page">4</span>
        <span className="next">Sau &gt;</span>
      </div>

      {showForm && <CreateAccountForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default Students;
