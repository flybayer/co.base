const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const dev = process.env.NODE_ENV !== "production";

export async function sendEmail(
  dest: string,
  subject: string,
  textContent: string
) {
  const msg = {
    to: dest,
    from: "Aven Support <support@aven.io>",
    subject: dev ? `${subject} [TEST]` : subject,
    text: textContent,
    // html: textContent,
  };
  await sgMail.send(msg);
}
