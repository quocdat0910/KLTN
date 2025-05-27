import React, { useState } from 'react';
import '../main.css';

const ContactUs = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log('Submitted:', form);
    alert('Form submitted successfully!');
  };

  return (
    <div style={{ width: 1446, height: 680, position: 'relative' }}>
        <div className='contact-container'>
              <div className="contact-bg" />
        <div className="contact-heading">
            Liên hệ với chúng tôi
        </div>
        {/* INPUTS */}
        <input
            className="contact-input-box"
            style={{ top: 265 }}
            type="text"
            name="firstName"
            placeholder="Họ"
            value={form.firstName}
            onChange={handleChange}
        />
        <input
            className="contact-input-box"
            style={{ top: 388 }}
            type="text"
            name="lastName"
            placeholder="Tên"
            value={form.lastName}
            onChange={handleChange}
        />
        <input
            className="contact-input-box"
            style={{ top: 513 }}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
        />

        {/* TEXTAREA */}
        <textarea
            className="contact-message-box"
            name="message"
            placeholder="Tin nhắn của bạn"
            value={form.message}
            onChange={handleChange}
        />

        {/* LABELS */}
        <div className="contact-label" style={{ top: 236 }}>Họ</div>
        <div className="contact-label" style={{ top: 362 }}>Tên</div>
        <div className="contact-label" style={{ top: 488 }}>Email</div>

        {/* SUBMIT BUTTON */}
        <button className="contact-submit-button" onClick={handleSubmit}>
            Gửi
        </button>
        </div>
    </div>
  );
};

export default ContactUs;
