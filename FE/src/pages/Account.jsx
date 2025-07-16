// src/pages/Account.jsx
import React, { useContext, useState } from 'react';
import styles from './Account.module.css';
import { Context } from '../main';
import axios from 'axios';
import AccountSidebar from '../components/AccountSidebar';
import ChangePasswordForm from '../components/ChangePasswordForm';

const SIDEBAR_ITEMS = [
  { icon: 'fa-user', label: 'Tài khoản' },
  { icon: 'fa-shopping-cart', label: 'Lịch sử đơn hàng' },
  { icon: 'fa-credit-card', label: 'Lịch sử giao dịch' },
  { icon: 'fa-lock', label: 'Mật khẩu và bảo mật' },
  { icon: 'fa-comments', label: 'Bình luận của tôi' },
  { icon: 'fa-heart', label: 'Sản phẩm yêu thích' },
  { icon: 'fa-share-alt', label: 'Giới thiệu bạn bè' },
];

const Account = () => {
  const { user, loading, fetchUserProfile } = useContext(Context);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '/user.png');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0,10) : '',
    gender: user?.gender || '',
    address: user?.address || '',
    avatar: null, // file object
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Khi user thay đổi (do fetch lại), cập nhật form
  React.useEffect(() => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0,10) : '',
      gender: user?.gender || '',
      address: user?.address || '',
      avatar: null,
    });
    setAvatarPreview(user?.avatar || '/user.png');
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0,10) : '',
      gender: user?.gender || '',
      address: user?.address || '',
      avatar: null,
    });
    setAvatarPreview(user?.avatar || '/user.png');
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      let data;
      let headers;
      if (form.avatar) {
        data = new FormData();
        data.append('firstName', form.firstName);
        data.append('lastName', form.lastName);
        data.append('phone', form.phone);
        data.append('dateOfBirth', form.dateOfBirth);
        data.append('gender', form.gender);
        data.append('address', form.address);
        data.append('avatar', form.avatar);
        headers = { 'Authorization': `Bearer ${token}` };
      } else {
        data = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          address: form.address,
        };
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
      }
      await axios.put('http://localhost:4000/api/v1/users/profile', data, {
        headers,
        withCredentials: true,
      });
      setSuccess('Cập nhật thành công!');
      setEditMode(false);
      await fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles['account-loading']}>Đang tải thông tin...</div>;
  if (!user) return <div className={styles['account-error']}>Không thể lấy thông tin người dùng.</div>;

  return (
    <div className={styles['account-page-container']}>
      <AccountSidebar activeIndex={0} />
      <div className={styles['account-main-content']}>
        <form className={styles['account-overview-grid']} onSubmit={handleSave}>
          <div className={styles['account-overview-info']}>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Email</span>
              <span className={styles['account-info-value']}>{user.email}</span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Họ</span>
              <span className={styles['account-info-value']}>
                {editMode ? (
                  <input name="firstName" value={form.firstName} onChange={handleChange} required className={styles['account-input']} />
                ) : (user.firstName || '-')}
              </span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Tên</span>
              <span className={styles['account-info-value']}>
                {editMode ? (
                  <input name="lastName" value={form.lastName} onChange={handleChange} required className={styles['account-input']} />
                ) : (user.lastName || '-')}
              </span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Số điện thoại</span>
              <span className={styles['account-info-value']}>
                {editMode ? (
                  <input name="phone" value={form.phone} onChange={handleChange} required className={styles['account-input']} />
                ) : (user.phone || '-')}
              </span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Ngày sinh</span>
              <span className={styles['account-info-value']}>
                {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Giới tính</span>
              <span className={styles['account-info-value']}>
                {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : '-'}
              </span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Địa chỉ</span>
              <span className={styles['account-info-value']}>
                {editMode ? (
                  <input name="address" value={form.address} onChange={handleChange} className={styles['account-input']} />
                ) : (user.address || '-')}
              </span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Vai trò</span>
              <span className={styles['account-info-value']}>{user.role === 'student' ? 'Học viên' : user.role === 'teacher' ? 'Giáo viên' : user.role === 'admin' ? 'Quản trị viên' : '-'}</span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Trạng thái xác thực</span>
              <span className={styles['account-info-value']} style={{ color: user.isVerified ? 'green' : 'red' }}>{user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
            </div>
            {/* Các trường không chỉnh sửa giữ nguyên */}
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>IELTS hiện tại</span>
              <span className={styles['account-info-value']}>{user.currentScore?.ielts ?? '-'}</span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>TOEIC hiện tại</span>
              <span className={styles['account-info-value']}>{user.currentScore?.toeic ?? '-'}</span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>IELTS mục tiêu</span>
              <span className={styles['account-info-value']}>{user.targetScore?.ielts ?? '-'}</span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>TOEIC mục tiêu</span>
              <span className={styles['account-info-value']}>{user.targetScore?.toeic ?? '-'}</span>
            </div>
            <div className={styles['account-info-row']}>
              <span className={styles['account-info-label']}>Mục tiêu học tập</span>
              <span className={styles['account-info-value']}>
                {user.studyGoals && user.studyGoals.length > 0 ? user.studyGoals.join(', ') : '-'}
              </span>
            </div>
          </div>
          <div className={styles['account-overview-avatar-block']}>
            <div className={styles['account-avatar-wrapper']}>
              <img className={styles['account-avatar-img']} src={avatarPreview} alt="avatar" />
            </div>
            <label htmlFor="avatar-upload" className={styles['account-avatar-upload-btn']} style={{cursor: editMode ? 'pointer' : 'not-allowed'}}>
              Sửa ảnh đại diện
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={editMode ? handleAvatarChange : undefined}
              disabled={!editMode}
            />
            <div className={styles['account-avatar-note']}>
              Vui lòng chọn ảnh nhỏ hơn 5MB<br />
              Chọn hình ảnh phù hợp, không phản cảm
            </div>
            {/* Nút đổi mật khẩu nằm ngay dưới avatar */}
            <div style={{ marginTop: 24 }}>
              {!showChangePassword ? (
                <button
                  className={styles['account-username-save-btn2']} style={{cursor: editMode ? 'pointer' : 'not-allowed'}}
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  disabled={!editMode}
                >
                  Đổi mật khẩu
                </button>
              ) : (
                <div>
                  <h3 className={styles['account-section-title']}>Đổi mật khẩu</h3>
                  <ChangePasswordForm onClose={() => setShowChangePassword(false)} />
                  <button
                    className={styles['account-username-save-btn2']}
                    type="button"
                    style={{marginTop: 12, background: '#ccc', color: '#333'}}
                    onClick={() => setShowChangePassword(false)}
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{gridColumn: '1/-1', marginTop: 16}}>
            {error && <div className={styles['account-error']}>{error}</div>}
            {success && <div className={styles['account-success']}>{success}</div>}
            {editMode ? (
              <>
                <button className={styles['account-username-save-btn']} type="submit" disabled={saving}>Lưu</button>
                <button className={styles['account-username-save-btn']} type="button" onClick={handleCancel} disabled={saving} style={{marginLeft: 8, background: '#ccc', color: '#333'}}>Hủy</button>
              </>
            ) : (
              <button className={styles['account-username-save-btn']} type="button" onClick={handleEdit}>Chỉnh sửa</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Account;