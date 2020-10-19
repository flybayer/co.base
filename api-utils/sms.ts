const Twilio = require("twilio");

let twilio : typeof Twilio | null = null;

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilio = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

const dev = process.env.NODE_ENV !== "production";

export async function sendSMS(
  dest: string,
  message: string,
) {

  if (twilio) {
    await twilio.messages.create({
     body: dev ? `${message} [TEST]` : message,
     from: `+${process.env.TWILIO_FROM_NUMBER}`,
     to: dest
   })
  } else {
    console.log("=======");
    console.log(
      "Email cannot be sent without setting Twilio in your .env.development.local file."
    );
    console.log(`-- Recipient: ${dest}`);
    console.log(`-- Message: ${message}`);
    console.log("=======");
  }
}
