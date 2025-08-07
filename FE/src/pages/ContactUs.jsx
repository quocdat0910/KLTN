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
    <main className="contactus-main">
      <section className="contactus-section animate-fade-in">
        <div className='contactus-flexbox contactus-bg'>
          <form className="contactus-form-modern" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <h2 className="contactus-title">Liên hệ với chúng tôi</h2>
            <div className="contactus-row">
              <div className="contactus-field">
                <label className="contactus-label-modern">Họ</label>
                <input
                  className="contactus-input-modern"
                  type="text"
                  name="firstName"
                  placeholder="Họ"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="contactus-field">
                <label className="contactus-label-modern">Tên</label>
                <input
                  className="contactus-input-modern"
                  type="text"
                  name="lastName"
                  placeholder="Tên"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="contactus-field">
              <label className="contactus-label-modern">Email</label>
              <input
                className="contactus-input-modern"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="contactus-field">
              <label className="contactus-label-modern">Tin nhắn của bạn</label>
              <textarea
                className="contactus-textarea-modern"
                name="message"
                placeholder="Tin nhắn của bạn"
                value={form.message}
                onChange={handleChange}
                required
              />
            </div>
            <button className="contactus-submit-btn-modern" type="submit">Gửi</button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default ContactUs;
