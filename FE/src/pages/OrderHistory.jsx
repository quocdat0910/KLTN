import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AccountSidebar from '../components/AccountSidebar';
import styles from './Account.module.css';

const OrderHistory = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:4000/api/v1/enrollments', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setEnrollments(res.data.enrollments || []);
      } catch (err) {
        setError('Không thể tải dữ liệu đơn hàng.');
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  return (
    <div className={styles['account-page-container']}>
      <AccountSidebar activeIndex={1} />
      <div className={styles['account-main-content']}>
        <div style={{background: '#fff', borderRadius: 12, padding: 2, maxWidth: 1100, margin: '32px auto'}}>
          <h2 style={{marginBottom: 20}}>Lịch sử đơn hàng</h2>
          <div style={{color: '#888', marginBottom: 16}}>Hiển thị thông tin các khóa học bạn đã đăng ký/mua.</div>
          {loading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div style={{color: 'red'}}>{error}</div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff'}}>
                <thead>
                  <tr style={{background: '#f5f7fa'}}>
                    <th style={{padding: '8px 17px', textAlign: 'left'}}>Thời gian</th>
                    <th style={{padding: '8px 15px', textAlign: 'left'}}>Mã đơn hàng</th>
                    <th style={{padding: '8px 190px', textAlign: 'left'}}>Khóa học</th>
                    <th style={{padding: '8px 12px', textAlign: 'center'}}>Số lượng</th>
                    <th style={{padding: '8px 12px', textAlign: 'right'}}>Tổng tiền</th>
                    <th style={{padding: '8px 12px', textAlign: 'center'}}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr><td colSpan={7} style={{textAlign: 'center', color: '#888'}}>Không có đơn hàng nào.</td></tr>
                  ) : enrollments.map((e) => (
                    <tr key={e._id} style={{borderBottom: '1px solid #eee'}}>
                      <td style={{padding: '8px 12px'}}>{new Date(e.enrolledAt).toLocaleString()}</td>
                      <td style={{padding: '8px 12px'}}>{e.paymentDetails?.paymentId || e._id}</td>
                      <td style={{padding: '8px 12px'}}>{e.courseId?.title || '---'}</td>
                      <td style={{padding: '8px 12px', textAlign: 'center'}}>1</td>
                      <td style={{padding: '8px 12px', textAlign: 'right'}}>{e.paymentDetails?.amount ? e.paymentDetails.amount.toLocaleString() + 'đ' : 'Miễn phí'}</td>
                      <td style={{padding: '8px 12px', textAlign: 'center', color: e.status === 'active' || e.status === 'completed' ? 'green' : 'gray'}}>
                        {e.status === 'active' || e.status === 'completed' ? 'Đã xử lý' : 'Hết hạn'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory; 