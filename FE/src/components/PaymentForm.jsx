import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../main.css';

const PaymentForm = ({ course, onClose }) => {
  const [loadingPaypal, setLoadingPaypal] = useState(false);
  const [paypalError, setPaypalError] = useState(null);

  useEffect(() => {
    if (window.paypal) {
      renderPayPalButtons();
      return;
    }

    const PAYPAL_CLIENT_ID_FRONTEND = import.meta.env.VITE_APP_PAYPAL_CLIENT_ID;
    console.log("PayPal Client ID:", PAYPAL_CLIENT_ID_FRONTEND);
    if (!PAYPAL_CLIENT_ID_FRONTEND) {
      setPaypalError("PayPal Client ID chưa được cấu hình.");
      toast.error("Lỗi cấu hình PayPal.");
      console.error("VITE_APP_PAYPAL_CLIENT_ID is not set.");
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID_FRONTEND}&currency=USD`;
    script.onload = () => {
      console.log("PayPal SDK Loaded.");
      renderPayPalButtons();
    };
    script.onerror = (e) => {
      console.error("Error loading PayPal SDK script:", e);
      setPaypalError("Không thể tải PayPal SDK. Vui lòng kiểm tra Client ID và kết nối mạng.");
      toast.error("Lỗi: Không thể tải PayPal SDK.");
    };
    document.body.appendChild(script);

    return () => {
      const paypalScript = document.querySelector(`script[src^="https://www.paypal.com/sdk/js?client-id="]`);
      if (paypalScript) {
        document.body.removeChild(paypalScript);
      }
    };
  }, [course]);

  const renderPayPalButtons = () => {
    if (!course || !course._id || !window.paypal) {
      console.warn("PayPal buttons cannot be rendered: Missing course info or PayPal SDK not loaded.");
      return;
    }

    const paypalButtonContainer = document.getElementById('paypal-button-container');
    if (!paypalButtonContainer) {
      console.error("PayPal button container not found in DOM.");
      return;
    }
    paypalButtonContainer.innerHTML = '';

    if (course.price === 0) {
      window.paypal.Buttons({
        createOrder: async () => {
          setLoadingPaypal(true);
          try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('UNAUTHORIZED: Token not found');
            const response = await axios.post(
              `http://localhost:4000/api/v1/courses/enroll/${course._id}`,
              { paymentData: { method: "free" } },
              { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            if (response.data && response.data.enrollment) {
              return "FREE_ORDER";
            }
            throw new Error('NO_ENROLLMENT: Server did not return enrollment');
          } catch (error) {
            setPaypalError(error.response?.data?.message || "Không thể đăng ký khóa học miễn phí.");
            toast.error(error.response?.data?.message || "Đăng ký thất bại.");
            setLoadingPaypal(false);
            throw error;
          }
        },
        onApprove: async () => {
          toast.success("Đăng ký khóa học miễn phí thành công!");
          setLoadingPaypal(false);
          onClose();
        }
      }).render('#paypal-button-container');
      return;
    }

    window.paypal.Buttons({
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: (course.price / 23000).toFixed(2), currency_code: "USD" }
          }]
        });
      },
      onApprove: async (data) => {
        setLoadingPaypal(true);
        setPaypalError(null);
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('UNAUTHORIZED: Token not found');
          const response = await axios.post(
            `http://localhost:4000/api/v1/courses/enroll/${course._id}`,
            {
              paymentData: {
                id: data.orderID,
                amount: course.price,
                currency: "VND",
                method: "paypal"
              }
            },
            { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          if (response.data && response.data.enrollment) {
            toast.success("Thanh toán thành công!");
            setLoadingPaypal(false);
            onClose();
          } else {
            throw new Error(response.data?.message || "Thanh toán không thành công.");
          }
        } catch (error) {
          setPaypalError(error.response?.data?.message || "Không thể hoàn tất thanh toán PayPal.");
          toast.error(error.response?.data?.message || "Thanh toán thất bại.");
          setLoadingPaypal(false);
        }
      },
      onCancel: () => {
        toast.info("Giao dịch PayPal đã bị hủy.");
        setLoadingPaypal(false);
      },
      onError: (err) => {
        console.error("PayPal Error:", err);
        setPaypalError("Đã xảy ra lỗi với PayPal. Vui lòng thử lại.");
        toast.error("Lỗi PayPal: " + err.message);
        setLoadingPaypal(false);
      }
    }).render('#paypal-button-container');
  };

  if (!course) {
    return (
      <div className="paymentForm-container">
        <div className="paymentForm-backgroundBox flex items-center justify-center">
          <p className="text-gray-700">Không có thông tin khóa học để thanh toán.</p>
          <button className="payment-close-button absolute top-4 right-4" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <div className="paymentForm-container">
      <div className="paymentForm-backgroundBox" />
      <div className="paymentForm-description">{course.description || "Chưa có mô tả cho khóa học này."}</div>
      <img className="paymentForm-image" src={course.thumbnail || 'https://placehold.co/200x100/E0E0E0/333333?text=No+Image'} alt={course.title} />
      <div className="paymentForm-courseTitle">{course.title}</div>
      <div className="paymentForm-sidePanel" />
      <div className="paymentForm-sideTitle">Chi tiết thanh toán</div>
      <div className="paymentForm-totalLabel">Tổng</div>
      <div className="paymentForm-courseName">{course.title}</div>
      <div className="paymentForm-priceLabel">Giá</div>
      <div className="paymentForm-divider top" />
      <div className="paymentForm-divider bottom" />
      <div className="paymentForm-priceValue">
        {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN') || 'N/A'} VND`}
      </div>
      <div className="paymentForm-totalValue">
        {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN') || 'N/A'} VND`}
      </div>
      <div id="paypal-button-container" className="paymentForm-paypal-btn-wrapper">
        {loadingPaypal && <p className="paypal-loading-text">Đang tải PayPal...</p>}
        {paypalError && <p className="paypal-error-text text-red-600">{paypalError}</p>}
      </div>
      <input className="paymentForm-discountInput" type="text" placeholder="Nhập mã giảm giá" disabled={loadingPaypal} />
      <button className="paymentForm-applyButton" disabled={loadingPaypal}>Áp dụng</button>
    </div>
  );
};

export default PaymentForm;