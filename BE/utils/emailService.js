import nodemailer from "nodemailer";

export const sendVerificationEmail = async (
  email,
  token,
  subject = "Xác minh tài khoản của bạn",
  content = ""
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const defaultVerificationUrl = `${
    process.env.BACKEND_URL
  }/api/v1/users/verify?token=${token}&redirect=${encodeURIComponent(
    process.env.FRONTEND_URL + "/login"
  )}`;
  const mailOptions = {
    from: `"IELTS-TOEIC Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html:
      content ||
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Xác minh tài khoản</h2>
        <p style="color: #555;">Vui lòng nhấp vào nút dưới đây để xác minh tài khoản của bạn:</p>
        <a 
          href="${defaultVerificationUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            text-align: center;
          "
        >
          Xác minh
        </a>
        <p style="color: #555;">Liên kết này sẽ hết hạn sau 15 phút.</p>
        <p style="color: #555;">Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
        <p style="word-break: break-all;"><a href="${defaultVerificationUrl}">${defaultVerificationUrl}</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error("Lỗi gửi email:", error.message);
    throw new Error("Không thể gửi email");
  }
};