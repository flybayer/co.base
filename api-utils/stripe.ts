import { sign } from "crypto";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default stripe;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export function readSignedWebhook(body: any, signature: any) {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
