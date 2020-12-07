import { Stripe } from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("Cannot find STRIPE_SECRET_KEY env var");
}
const stripe = new Stripe(secretKey, { apiVersion: "2020-08-27" });

export default stripe;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
if (!webhookSecret) {
  throw new Error("Cannot find STRIPE_WEBHOOK_SECRET env var");
}

export function readSignedWebhook(body: any, signature: any): Stripe.Event {
  const a = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  return a;
}
