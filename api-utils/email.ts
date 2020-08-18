const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(
  dest: string,
  subject: string,
  textContent: string
) {
  const msg = {
    to: dest,
    from: "Aven Support <support@aven.io>",
    subject: subject,
    text: textContent,
    // html: textContent,
  };
  await sgMail.send(msg);
}
