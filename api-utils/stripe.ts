import { Stripe } from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export let stripe: null | Stripe = null;

if (secretKey && webhookSecret) {
  stripe = new Stripe(secretKey, { apiVersion: "2020-08-27" });
}

export default stripe;

export function readSignedWebhook(body: any, signature: any): Stripe.Event {
  if (!stripe) {
    throw new Error("Stripe not configured.");
  }
  const a = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  return a;
}
