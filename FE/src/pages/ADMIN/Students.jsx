import { useState, useEffect, useCallback } from 'react'; // Thêm useCallback
import '../../Component.css';
import { FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import CreateAccountForm from '../../components/CreateAccountForm';
import axios from "axios";

const Students = () => {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  const formatRole = (role) => {
    if (role === "admin") return "Admin";
    if (role === "student") return "Khách hàng";
    return "Không xác định";
  };

  const formatGender = (gender) => {
    if (gender === "male") return "Nam";
    if (gender === "female") return "Nữ";
    return "Khác";
  };

  // Sử dụng useCallback để hàm fetchUsers không bị tạo lại mỗi khi component render
  // Điều này tốt cho hiệu suất và giúp useEffect không chạy lại không cần thiết
  const fetchUsers = useCallback(async () => {
    setLoading(true); // Bắt đầu tải lại, đặt loading thành true
    try {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        console.warn("Không tìm thấy token admin. Vui lòng đăng nhập.");
        // Có thể điều hướng về trang đăng nhập nếu không có token
        // navigateTo("/login");
        setLoading(false);
        return;
      }

      const res = await axios.get("http://localhost:4000/api/v1/users", {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      setUsers(res.data.users);
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("Lỗi xác thực: Không được phép truy cập danh sách người dùng. Vui lòng đăng nhập lại.", error.response.data.message);
      } else {
        console.error("Lỗi khi lấy danh sách người dùng:", error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []); // Không có dependencies vì nó không phụ thuộc vào state nào khác trong component

  useEffect(() => {
    fetchUsers(); // Gọi fetchUsers khi component mount lần đầu
  }, [fetchUsers]); // Dependency array: chạy lại khi fetchUsers thay đổi (sẽ chỉ chạy một lần do useCallback)

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null); // Reset người dùng đang chỉnh sửa
    fetchUsers(); // Tải lại danh sách người dùng sau khi tạo/chỉnh sửa thành công
  };

  // ⭐ Hàm xử lý xóa tài khoản ⭐
  const handleDelete = async (userId, userRole) => {
    

    if (userRole === 'admin') {
      alert("Bạn không thể xóa tài khoản Admin khác từ giao diện này để đảm bảo an toàn. Vui lòng liên hệ quản trị viên cấp cao hơn.");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không?")) {
      return; // Người dùng hủy bỏ
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        alert('Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
        return;
      }

      // Gửi yêu cầu DELETE tới backend
      const res = await axios.delete(`http://localhost:4000/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        withCredentials: true,
      });

      if (res.status === 200) {
        alert(res.data.message || 'Xóa tài khoản thành công!');
        fetchUsers(); // Tải lại danh sách người dùng để cập nhật bảng
      } else {
        alert(res.data.message || 'Có lỗi xảy ra khi xóa tài khoản.');
      }
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Không thể kết nối đến server. Vui lòng thử lại sau.');
    }
  };

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
        <button className="add-btn" onClick={() => { setEditingUser(null); setShowForm(true); }}>Thêm tài khoản</button>
      </div>

      {loading ? (
        <p>Đang tải danh sách người dùng...</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>SDT</th>
              <th>Vai trò</th>
              <th>Giới tính</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((u, index) => (
              <tr key={u._id}>
                <td>{index + 1}</td>
                <td>{u.fullName || `${u.lastName} ${u.firstName}`}</td>
                <td>{u.email}</td>
                <td>{u.phone || "Không có"}</td>
                <td>{formatRole(u.role)}</td>
                <td>{formatGender(u.gender)}</td>
                <td className="action-icons">
                  <FaEdit className="icon edit" onClick={() => handleEdit(u)} />
                  {/* ⭐ Gán hàm handleDelete vào nút FaTrash ⭐ */}
                  <FaTrash className="icon delete" onClick={() => handleDelete(u._id, u.role)} />
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7">Không có người dùng nào</td></tr>
            )}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <span className="prev">&lt; Trước</span>
        <span className="page active">1</span>
        <span className="page">2</span>
        <span className="page">3</span>
        <span className="page">4</span>
        <span className="next">Sau &gt;</span>
      </div>

      {showForm && (
        <CreateAccountForm 
          onClose={handleCloseForm} 
          userToEdit={editingUser} 
          // Truyền fetchUsers vào để CreateAccountForm có thể gọi lại sau khi tạo/cập nhật
          fetchUsersCallback={fetchUsers} 
        />
      )}
    </div>
  );
};

export default Students;