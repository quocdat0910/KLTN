import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../main.css';

// Chấp nhận props course (thông tin khóa học) và onClose (hàm đóng form)
const PaymentForm = ({ course, onClose }) => {
    const [loadingPaypal, setLoadingPaypal] = useState(false);
    const [paypalError, setPaypalError] = useState(null);

    useEffect(() => {
        // Kiểm tra xem PayPal SDK đã được tải chưa
        if (window.paypal) {
            renderPayPalButtons();
            return;
        }

        // Lấy PayPal Client ID từ biến môi trường của frontend
        // Dành cho Vite: import.meta.env.VITE_APP_PAYPAL_CLIENT_ID
        // Dành cho Create React App: process.env.REACT_APP_PAYPAL_CLIENT_ID
        const PAYPAL_CLIENT_ID_FRONTEND = import.meta.env.VITE_APP_PAYPAL_CLIENT_ID; // <--- SỬ DỤNG BIẾN MÔI TRƯỜNG FRONTEND

        if (!PAYPAL_CLIENT_ID_FRONTEND) {
            setPaypalError("PayPal Client ID cho Frontend chưa được cấu hình. Vui lòng kiểm tra biến môi trường.");
            toast.error("Lỗi cấu hình PayPal.");
            console.error("VITE_APP_PAYPAL_CLIENT_ID is not set in frontend environment variables.");
            return;
        }

        // Tải PayPal SDK script một cách động
        const script = document.createElement('script');
        // Sử dụng biến môi trường frontend ở đây
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
            // Dọn dẹp script khi component unmounts
            const paypalScript = document.querySelector(`script[src^="https://www.paypal.com/sdk/js?client-id="]`);
            if (paypalScript) {
                document.body.removeChild(paypalScript);
            }
        };
    }, [course]); // Phụ thuộc vào course để re-render nếu thông tin course thay đổi

    const renderPayPalButtons = () => {
        if (!course || !course._id || course.price === undefined || !window.paypal) { // Kiểm tra price !== undefined
            console.warn("PayPal buttons cannot be rendered: Missing course info (ID/Price) or PayPal SDK not loaded.");
            return;
        }

        // Đảm bảo chỉ render một lần và không bị trùng lặp
        const paypalButtonContainer = document.getElementById('paypal-button-container');
        if (paypalButtonContainer) {
            paypalButtonContainer.innerHTML = ''; // Xóa nội dung cũ để tránh lỗi render lại
        } else {
            console.error("PayPal button container not found in DOM."); 
            return;
        }

        window.paypal.Buttons({
            // Hàm này được gọi khi người dùng nhấp vào nút PayPal
            createOrder: async (data, actions) => {
                setLoadingPaypal(true);
                setPaypalError(null);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        toast.error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
                        setLoadingPaypal(false);
                        // Thay thế actions.reject bằng throw new Error()
                        throw new Error('UNAUTHORIZED: Token not found'); 
                    }

                    // Gọi API backend của bạn để tạo PayPal order
                    // Endpoint: POST /api/v1/courses/:courseId/payments/paypal
                    const response = await axios.post(
                        `http://localhost:4000/api/v1/courses/${course._id}/payments/paypal`,
                        {
                            courseId: course._id,
                            price: course.price,
                            currency: 'USD' // Đảm bảo currency này khớp với currency bạn setup trên PayPal và backend
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            withCredentials: true
                        }
                    );

                    if (response.data && response.data.orderId) {
                        toast.info("Đang tạo order PayPal...");
                        return response.data.orderId; // Trả về order ID từ backend
                    } else {
                        toast.error("Lỗi: Không nhận được order ID từ server.");
                        setLoadingPaypal(false);
                        // Thay thế actions.reject bằng throw new Error()
                        throw new Error('NO_ORDER_ID: Server did not return an order ID'); 
                    }
                } catch (error) {
                    console.error("Error creating PayPal order:", error);
                    setPaypalError(error.response?.data?.message || "Không thể tạo order PayPal.");
                    toast.error(error.response?.data?.message || "Tạo order PayPal thất bại.");
                    setLoadingPaypal(false);
                    // Thay thế actions.reject bằng throw new Error()
                    throw error; // Ném lại lỗi để PayPal SDK có thể bắt và hiển thị thông báo lỗi phù hợp
                }
            },
            // Hàm này được gọi sau khi người dùng hoàn tất thanh toán trên PayPal
            onApprove: async (data, actions) => {
                setLoadingPaypal(true);
                setPaypalError(null);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        toast.error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
                        setLoadingPaypal(false);
                        // Thay thế actions.reject bằng throw new Error()
                        throw new Error('UNAUTHORIZED: Token not found for approval');
                    }

                    // Gọi API backend của bạn để capture PayPal order
                    // Endpoint: POST /api/v1/payments/paypal/capture
                    const response = await axios.post(
                        `http://localhost:4000/api/v1/payments/paypal/capture`,
                        {
                            orderId: data.orderID,
                            courseId: course._id // Truyền courseId để backend biết khóa học nào được mua
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            withCredentials: true
                        }
                    );

                    if (response.data && response.data.success) {
                        toast.success("Thanh toán thành công! Khóa học đã được thêm vào tài khoản của bạn.");
                        setLoadingPaypal(false);
                        onClose(); // Đóng form thanh toán
                        // Có thể điều hướng người dùng đến trang khóa học đã mua hoặc trang xác nhận
                        // navigate('/my-courses');
                    } else {
                        setPaypalError(response.data?.message || "Thanh toán không thành công.");
                        toast.error(response.data?.message || "Thanh toán thất bại.");
                        setLoadingPaypal(false);
                    }
                } catch (error) {
                    console.error("Error capturing PayPal order:", error);
                    setPaypalError(error.response?.data?.message || "Không thể hoàn tất thanh toán PayPal.");
                    toast.error(error.response?.data?.message || "Hoàn tất thanh toán thất bại.");
                    setLoadingPaypal(false);
                }
            },
            // Hàm này được gọi nếu người dùng hủy thanh toán
            onCancel: (data) => {
                toast.info("Giao dịch PayPal đã bị hủy.");
                setLoadingPaypal(false);
            },
            // Hàm này được gọi nếu có lỗi xảy ra trong quá trình PayPal
            onError: (err) => {
                console.error("PayPal Error:", err);
                setPaypalError("Đã xảy ra lỗi với PayPal. Vui lòng thử lại.");
                toast.error("Lỗi PayPal: " + err.message);
                setLoadingPaypal(false);
            }
        }).render('#paypal-button-container'); // Render nút vào container
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
            <button className="payment-close-button" onClick={onClose}>Đóng</button> {/* Nút đóng bên trong form */}

            {/* Thông tin khóa học (động) */}
            <div className="paymentForm-description">
                {course.description || "Chưa có mô tả cho khóa học này."}
            </div>
            <img className="paymentForm-image" src={course.thumbnail || 'https://placehold.co/200x100/E0E0E0/333333?text=No+Image'} alt={course.title} />
            <div className="paymentForm-courseTitle">{course.title}</div>

            {/* Chi tiết thanh toán (động) */}
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

            {/* Phần mã giảm giá */}
            <input className="paymentForm-discountInput" type="text" placeholder="Nhập mã giảm giá" disabled={loadingPaypal} />
            <button className="paymentForm-applyButton" disabled={loadingPaypal}>Áp dụng</button>

              {/* Container cho PayPal Button */}
            <div id="paypal-button-container" className="paymentForm-paypal-btn-wrapper">
                {loadingPaypal && <p className="paypal-loading-text">Đang tải PayPal...</p>}
                {paypalError && <p className="paypal-error-text text-red-600">{paypalError}</p>}
                {/* Nút PayPal sẽ được render vào đây bởi SDK */}
            </div>
        </div>
    );
};

export default PaymentForm;
