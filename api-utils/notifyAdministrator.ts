import { sendEmail } from "./email";

export default function notifyAdministrator(msg: string, body: string) {
  await sendEmail("admin@aven.io", msg, body);
}
