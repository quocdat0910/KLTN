import { useState, useEffect, useCallback } from 'react';
import '../../Component.css'; // Đảm bảo đường dẫn CSS đúng
import { FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import CreateAccountForm from '../../components/CreateAccountForm'; // Đảm bảo đường dẫn component đúng
import axios from "axios";

const Students = () => {
  const [showForm, setShowForm] = useState(false); // State để điều khiển hiển thị/ẩn form tạo/chỉnh sửa
  const [users, setUsers] = useState([]); // State để lưu trữ danh sách người dùng
  const [loading, setLoading] = useState(true); // State để hiển thị trạng thái tải dữ liệu
  const [editingUser, setEditingUser] = useState(null); // State để lưu trữ thông tin người dùng đang được chỉnh sửa

  // Hàm định dạng vai trò để hiển thị thân thiện hơn
  const formatRole = (role) => {
    if (role === "admin") return "Admin";
    if (role === "student") return "Khách hàng";
    return "Không xác định";
  };

  // Hàm định dạng giới tính để hiển thị thân thiện hơn
  const formatGender = (gender) => {
    if (gender === "male") return "Nam";
    if (gender === "female") return "Nữ";
    return "Khác";
  };

  // Hàm bất đồng bộ để lấy danh sách người dùng từ API
  // Sử dụng useCallback để memoize hàm này, tránh việc nó được tạo lại không cần thiết
  const fetchUsers = useCallback(async () => {
    setLoading(true); // Bắt đầu quá trình tải dữ liệu
    try {
      const adminToken = localStorage.getItem('token'); // Lấy token admin từ localStorage

      if (!adminToken) {
        console.warn("Không tìm thấy token admin. Vui lòng đăng nhập.");
        // Bạn có thể thêm logic chuyển hướng đến trang đăng nhập ở đây nếu cần
        setLoading(false);
        return;
      }

      // Gửi yêu cầu GET đến API để lấy danh sách người dùng
      const res = await axios.get("http://localhost:4000/api/v1/users", {
        withCredentials: true, // Cho phép gửi cookies (quan trọng cho xác thực)
        headers: {
          Authorization: `Bearer ${adminToken}`, // Gửi token xác thực
        },
      });
      setUsers(res.data.users); // Cập nhật state với danh sách người dùng
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("Lỗi xác thực: Không được phép truy cập danh sách người dùng. Vui lòng đăng nhập lại.", error.response.data.message);
      } else {
        console.error("Lỗi khi lấy danh sách người dùng:", error.message);
      }
    } finally {
      setLoading(false); // Kết thúc quá trình tải dữ liệu, dù thành công hay thất bại
    }
  }, []); // Dependency array rỗng, hàm này sẽ chỉ được tạo một lần khi component mount

  // useEffect để gọi fetchUsers khi component mount lần đầu
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // fetchUsers là dependency, nhưng do useCallback nên nó ổn định

  // Hàm xử lý khi click nút chỉnh sửa
  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit); // Lưu thông tin người dùng cần chỉnh sửa vào state
    setShowForm(true); // Hiển thị form
  };

  // Hàm xử lý khi đóng form (tạo mới hoặc chỉnh sửa)
  const handleCloseForm = () => {
    setShowForm(false); // Ẩn form
    setEditingUser(null); // Reset người dùng đang chỉnh sửa
    fetchUsers(); // Gọi lại fetchUsers để cập nhật danh sách sau khi có thay đổi
  };

  // Hàm xử lý xóa tài khoản
  const handleDelete = async (userId, userRole) => {
    // Ngăn chặn xóa tài khoản Admin để đảm bảo an toàn cơ bản từ phía frontend
    // Logic kiểm tra tài khoản Admin hiện tại đang đăng nhập nên được xử lý ở backend
    if (userRole === 'admin') {
      alert("Bạn không thể xóa tài khoản Admin từ giao diện này. Vui lòng liên hệ quản trị viên cấp cao hơn.");
      return;
    }

    // Yêu cầu xác nhận từ người dùng trước khi xóa
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không?")) {
      return; // Người dùng hủy bỏ thao tác
    }

    try {
      const adminToken = localStorage.getItem('token'); // Lấy token admin

      if (!adminToken) {
        alert('Không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
        return;
      }

      // Gửi yêu cầu DELETE tới backend
      const res = await axios.delete(`http://localhost:4000/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`, // Gửi token xác thực
        },
        withCredentials: true,
      });

      if (res.status === 200) {
        alert(res.data.message || 'Xóa tài khoản thành công!');
        fetchUsers(); // Tải lại danh sách người dùng để cập nhật bảng
      } else {
        alert(res.data.data.message || 'Có lỗi xảy ra khi xóa tài khoản.'); // Sử dụng res.data.data.message nếu backend trả về cấu trúc đó
      }
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Không thể kết nối đến server. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className='h2'>Quản lý Tài khoản</h2> {/* Đổi tiêu đề cho rõ ràng hơn */}
      </div>

      <div className="search-add">
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
                <td>{u.fullName || `${u.firstName} ${u.lastName}`}</td> {/* Hiển thị fullName hoặc kết hợp lastName firstName */}
                <td>{u.email}</td>
                <td>{u.phone || "Không có"}</td>
                <td>{formatRole(u.role)}</td>
                <td>{formatGender(u.gender)}</td>
                <td className="action-icons">
                  <FaEdit className="icon edit" onClick={() => handleEdit(u)} />
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
          fetchUsersCallback={fetchUsers} // Truyền fetchUsers để form có thể kích hoạt tải lại danh sách
        />
      )}
    </div>
  );
};

export default Students;