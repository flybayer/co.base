import sgMail from "@sendgrid/mail";

const { SENDGRID_API_KEY } = process.env;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const dev = process.env.NODE_ENV !== "production";

export async function sendEmail(dest: string, subject: string, textContent: string) {
  const msg = {
    to: dest,
    from: "Aven Support <support@aven.io>",
    subject: dev ? `${subject} [TEST]` : subject,
    text: textContent,
    // html: textContent,
  };
  if (SENDGRID_API_KEY) {
    await sgMail.send(msg);
  } else {
    console.log("=======");
    console.log("Email cannot be sent without setting SENDGRID_API_KEY in your .env.development.local file.");
    console.log(`-- Recipient: ${dest}`);
    console.log(`-- Subject: ${subject}`);
    console.log(`-- Text Body: ${textContent}`);
    console.log("=======");
  }
}
