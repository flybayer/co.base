import { sendEmail } from "./email";

export default async function notifyAdministrator(msg: string, body: string) {
  await sendEmail("admin@aven.io", msg, body);
}
