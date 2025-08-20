import transporter from '../config/mailer.config.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const mailOptions = {
    from: `"University Library" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email jo'natildi: " + info.response);
  } catch (error) {
    console.error("Email jo'natishda xatolik:", error);
  }
};
