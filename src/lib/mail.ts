import nodemailer from "nodemailer";

interface InquiryData {
  name: string;
  phone: string;
  requirement: string;
  message?: string;
}

// Target notification email addresses
const DEFAULT_NOTIFICATION_EMAILS = [
  "realestateshreekarni@gmail.com",
];

export async function sendInquiryNotification(data: InquiryData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { name, phone, requirement, message } = data;

  const recipientList = process.env.NOTIFICATION_EMAIL
    ? process.env.NOTIFICATION_EMAIL.split(",").map((e) => e.trim())
    : DEFAULT_NOTIFICATION_EMAILS;

  const to = recipientList.join(", ");

  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>New Property Inquiry - Shree Karni Real Estate</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: #0a1628; padding: 24px; text-align: center; border-bottom: 3px solid #e9b04c; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px; }
          .header p { color: #e9b04c; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          .content { padding: 30px 24px; color: #1e293b; }
          .badge { display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
          .row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #64748b; font-size: 13px; width: 40%; }
          .value { font-weight: 600; color: #0f172a; font-size: 14px; width: 60%; text-align: right; }
          .message-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; font-size: 14px; line-height: 1.6; color: #334155; margin-top: 10px; }
          .btn { display: inline-block; background: #e9b04c; color: #0a1628; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; text-align: center; }
          .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SHREE KARNI REAL ESTATE</h1>
            <p>New Property Inquiry Received</p>
          </div>
          <div class="content">
            <span class="badge">Live Website Lead</span>
            <p style="margin-top: 0; font-size: 15px; color: #334155;">
              Someone just submitted a message on the <strong>Send Us a Message</strong> form on the website. Here are their complete details:
            </p>

            <div class="card">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b; font-size: 13px;">Full Name</td>
                  <td style="padding: 10px 0; font-weight: 700; color: #0f172a; font-size: 15px; text-align: right;">${name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b; font-size: 13px;">Phone Number</td>
                  <td style="padding: 10px 0; font-weight: 700; color: #0f172a; font-size: 15px; text-align: right;">
                    <a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b; font-size: 13px;">Requirement</td>
                  <td style="padding: 10px 0; font-weight: 700; color: #d97706; font-size: 14px; text-align: right;">${requirement}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: 600; color: #64748b; font-size: 13px;">Date & Time</td>
                  <td style="padding: 10px 0; font-weight: 500; color: #64748b; font-size: 12px; text-align: right;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                </tr>
              </table>
            </div>

            ${
              message
                ? `
                <div style="margin-top: 15px;">
                  <strong style="font-size: 13px; color: #475569;">Customer Message / Budget Queries:</strong>
                  <div class="message-box">${message.replace(/\n/g, "<br />")}</div>
                </div>
              `
                : ""
            }

            <div style="text-align: center; margin-top: 25px;">
              <a href="tel:${phone}" class="btn">📞 Call ${name} Directly (${phone})</a>
            </div>
          </div>
          <div class="footer">
            © 2024 Shree Karni Real Estate • Main Vatika Road, Jaipur, Rajasthan<br />
            Notification sent automatically from www.shreekarnirealestate.in
          </div>
        </div>
      </body>
    </html>
  `;

  // If SMTP configuration is provided in env, use Nodemailer
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Shree Karni Real Estate" <${smtpUser}>`,
        to,
        subject: `New Property Inquiry: ${name} (${phone}) - ${requirement}`,
        html: htmlContent,
      });

      console.log("Email notification sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error("Nodemailer delivery error:", err);
      // Return gracefully with error details
      return { success: false, error: err.message || "Failed to deliver email" };
    }
  }

  // Fallback: If SMTP_USER/SMTP_PASS are not configured yet, log details
  console.log("=========================================");
  console.log("NEW PROPERTY INQUIRY (SMTP NOT CONFIGURED YET)");
  console.log("To:", to);
  console.log("Name:", name);
  console.log("Phone:", phone);
  console.log("Requirement:", requirement);
  console.log("Message:", message);
  console.log("=========================================");

  return {
    success: true,
    messageId: `log-${Date.now()}`,
  };
}
