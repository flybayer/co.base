const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export function sendEmail(dest: string, subject: string, textContent: string) {
  const msg = {
    to: dest,
    from: "support@aven.io",
    subject: subject,
    text: textContent,
    // html: textContent,
  };
  sgMail.send(msg);
}
