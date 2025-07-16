import React from 'react';
import styles from '../pages/Account.module.css';
import { useNavigate } from 'react-router-dom';

const SIDEBAR_ITEMS = [
  { icon: 'fa-user', label: 'Tài khoản', path: '/myaccount' },
  { icon: 'fa-shopping-cart', label: 'Lịch sử đơn hàng', path: '/order-history' },
  { icon: 'fa-graduation-cap', label: 'Học tập', path: '/mycourse' },
];

const AccountSidebar = ({ activeIndex = 0 }) => {
  const navigate = useNavigate();
  return (
    <div className={styles['account-sidebar']}>
      {SIDEBAR_ITEMS.map((item, idx) => (
        <div
          className={
            styles['account-sidebar-item'] + (idx === activeIndex ? ' ' + styles['active'] : '')
          }
          key={item.label}
          onClick={() => navigate(item.path)}
          style={{ cursor: 'pointer' }}
        >
          <i className={`fa ${item.icon}`}></i>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default AccountSidebar; 