import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../lib/server/createAPI";
import { serialize } from "php-serialize";
import crypto from "crypto";
import { sendEmail } from "../../lib/server/email";
import { database } from "../../lib/data/database";

const paddlePublicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvKl5MsOihG1ytxWIBCDv
K2z/vCBPgJNcntJN4pnWwcZddziNXCTe1tsLXjrEWH5dgbZkUhEhnlcYpL7mgq+Q
1N5LcAy8ojM40bZ8o7K/qgOWVH4aOlUB1raFEWwvRW3ki/FrAgzPZd/0kU+dxili
qelt8WqwixmXKcTbJiyJSTlG+FApkHuwaCq2AJlrg5/MqlTQu9spbtB4ySbUteW0
2pUgXmerZdbx+5bblUj43INgrvDu4CxVaQahjz72M7AU4VjhLlMl0imfAzc1JJUX
m2Pi9vcakPMPLX01OX/2le4deRZxJ7KL3kXjD8LlBXqw++dTxpWe2hQWBT/9S42p
tm97FXoswjb3kQmJ5GvWunnKh4iS3fNMa5BtCFWEP6ApMh5KP57GeN0oJDQIcDCt
0qvg92xqBnzm49EfShWKBCkoXrEfg5n7WvHAAZ3McrGdY1I3e9bDBs7wpr7ifssy
Wgz5ERppXE4Ns9Hxp3SAkUvG4ME+vpb+VMwl7/r8ptT+LC1j1ilyTSawgmu6XWQI
QpUL/O4IgzjKfzqBuIfYK+/MN8aDWMLlNlPB6xoalz3W0P44UrY38DMT7Zy9sbG2
ooG6OUZYbHYZ8JlzFlwqd366JcZf4BjtmTtFJW+TyWkgNi42VoPoWAThDyFkZcDL
ekv3Jr+ke7fGhNEGOBbpOm8CAwEAAQ==
-----END PUBLIC KEY-----`;

function ksort(obj: any) {
  const keys = Object.keys(obj).sort();
  const sortedObj: any = {};
  for (const i in keys) {
    sortedObj[keys[i]] = obj[keys[i]];
  }
  return sortedObj;
}
// from https://developer.paddle.com/webhook-reference/verifying-webhooks
function validateWebhook(inputPayload: any): boolean {
  const mySig = Buffer.from(inputPayload.p_signature, "base64");
  let payload = { ...inputPayload };
  delete payload.p_signature;
  payload = ksort(payload);
  for (const property in payload) {
    if (payload.hasOwnProperty(property) && typeof payload[property] !== "string") {
      if (Array.isArray(payload[property])) {
        payload[property] = payload[property].toString();
      } else {
        payload[property] = JSON.stringify(payload[property]);
      }
    }
  }
  const serialized = serialize(payload);
  const verifier = crypto.createVerify("sha1");
  verifier.update(serialized);
  verifier.end();
  const verification = verifier.verify(paddlePublicKey, mySig);
  return verification;
}

type PaddleStatus = "active" | "trialing" | "past_due" | "deleted";

type PSubsPaymentSucceded = {
  alert_name: "subscription_payment_succeeded";
  alert_id: string;
  currency: string;
  checkout_id: string;
  country: string;
  coupon?: string;
  customer_name: string;
  email: string;
  event_time: string; //'yyyy-mm-dd hh:mm:ss'
  payment_method: string;
  plan_name: string;
  quantity: string;
  receipt_url: string;
  unit_price: string; //12.00
  user_id: string;
  subscription_id: string;
  subscription_payment_id: string;
  subscription_plan_id: string;
  passthrough: string;
  sale_gross: string;
  next_bill_date: string;
  next_payment_amount: string;
  status: PaddleStatus;
};

type PSubsPaymentFailed = {
  alert_name: "subscription_payment_failed";
  alert_id: string;
  user_id: string;
  checkout_id: string;
  email: string;
  passthrough: string;
  status: PaddleStatus;
  event_time: string; //'yyyy-mm-dd hh:mm:ss'
  currency: string;
  amount: string;
  update_url: string;
  cancel_url: string;
};

type PSubsCreated = {
  alert_name: "subscription_created";
  alert_id: string;
  user_id: string;
  checkout_id: string;
  email: string;
  passthrough: string;
  status: PaddleStatus;
  subscription_id: string;
  subscription_plan_id: string;
  update_url: string;
  cancel_url: string;
  marketing_consent: string;
};

type PSubsUpdated = {
  alert_name: "subscription_updated";
  alert_id: string;
  user_id: string;
  subscription_id: string;
  checkout_id: string;
  email: string;
  passthrough: string;
  status: PaddleStatus;
  new_quantity: string; // \d+
  next_bill_date: string; // YYYY-MM-DD
  currency: string;
  new_price: string;
  paused_at: string;
  paused_from: string;
  paused_reason: string;
  marketing_consent: string;
};

type PSubsCancelled = {
  alert_name: "subscription_cancelled";
  alert_id: string;
  user_id: string;
  checkout_id: string;
  email: string;
  passthrough: string;
  cancellation_effective_date: string;
  subscription_id: string;
  subscription_plan_id: string;
  status: PaddleStatus;
  marketing_consent: string;
};

type PaddlePayload = PSubsPaymentSucceded | PSubsPaymentFailed | PSubsCreated | PSubsCancelled | PSubsUpdated;

type SubscriptionState = {
  status: PaddleStatus;
  subscription_id?: string;
  subscription_plan_id?: string;
  checkout_id?: string;
  cancellation_effective_date?: string;
  paused_at?: string;
  paused_from?: string;
  paused_reason?: string;
  currency?: string;
  price?: string;
  plan_name?: string;
  cancel_url?: string;
  update_url?: string;
  next_bill_date?: string;
  next_payment_amount?: string;
};

export type BillingState = {
  billing_email?: string;
  customer_id?: string;
  receipts?: Array<{
    date: string;
    url: string;
    amount: string;
    currency: string;
  }>;
  subscriptions?: Record<string, SubscriptionState>;
  marketing_consent?: string; // "0" for refuse, "1" for marketing consent
};

async function billingTransact(event: PaddlePayload, billingTransact: (b: BillingState) => BillingState) {
  let userId = undefined;
  try {
    const passMeta = JSON.parse(event.passthrough);
    if (passMeta.userId) {
      userId = passMeta.userId;
    }
  } catch (e) {}
  await database.billingEvent.create({
    data: {
      payload: event,
      type: event.alert_name,
      time: new Date(),
      user: userId && { connect: { id: userId } },
    },
  });
  const userQuery = userId ? { id: userId } : { email: event.email };
  const billingUser = await database.user.findUnique({
    where: userQuery,
    select: {
      id: true,
      billing: true,
    },
  });
  const prevBilling = billingUser?.billing ? (billingUser.billing as BillingState) : {};
  const newBilling = billingTransact(prevBilling);
  await database.user.update({
    where: userQuery,
    data: { billing: newBilling },
  });
}

async function handleSubscriptionCancelled(event: PSubsCancelled) {
  await billingTransact(event, (state) => {
    const {
      cancellation_effective_date,
      status,
      subscription_id,
      subscription_plan_id,
      checkout_id,
      marketing_consent,
    } = event;
    return {
      ...state,
      marketing_consent,
      cancellation_effective_date,
      status: status,
      subscriptions: {
        ...state.subscriptions,
        [subscription_id]: {
          ...((state.subscriptions && state.subscriptions[subscription_id]) || {}),
          status,
          subscription_id,
          subscription_plan_id,
          checkout_id,
          cancellation_effective_date,
        },
      },
    };
  });
}
async function handleSubscriptionCreated(event: PSubsCreated) {
  await billingTransact(event, (state) => {
    const { user_id, email, cancel_url, update_url, subscription_id, subscription_plan_id, marketing_consent } = event;
    const prevSub = (state.subscriptions || {})[subscription_id] || {};
    return {
      ...state,
      marketing_consent,
      customer_id: user_id,
      email,
      cancel_url,
      update_url,
      subscriptions: {
        ...state.subscriptions,
        [subscription_id]: {
          ...prevSub,
          subscription_plan_id,
          update_url,
          cancel_url,
          status: event.status ? event.status : prevSub.status,
        },
      },
    };
  });
}
async function handleSubscriptionUpdated(event: PSubsUpdated) {
  await billingTransact(event, (state) => {
    const { subscription_id, next_bill_date, new_price, marketing_consent } = event;
    const prevSub = (state.subscriptions || {})[subscription_id] || {};

    return {
      ...state,
      marketing_consent,
      subscriptions: {
        ...state.subscriptions,
        [subscription_id]: {
          ...prevSub,
          next_bill_date,
          price: new_price,
          status: event.status ? event.status : prevSub.status,
        },
      },
    };
  });
}
async function handleSubscriptionPaymentSucceded(event: PSubsPaymentSucceded) {
  await billingTransact(
    event,
    (state: BillingState): BillingState => {
      const {
        user_id,
        email,
        receipt_url,
        event_time,
        sale_gross,
        currency,
        plan_name,
        checkout_id,
        subscription_id,
        subscription_plan_id,
        status,
        unit_price,
        next_bill_date,
        next_payment_amount,
      } = event;
      return {
        ...state,
        customer_id: user_id,
        billing_email: email,
        receipts: [
          ...(state.receipts || []),
          {
            amount: sale_gross,
            currency,
            url: receipt_url,
            date: event_time,
          },
        ],
        subscriptions: {
          ...state.subscriptions,
          [subscription_id]: {
            ...((state.subscriptions && state.subscriptions[subscription_id]) || {}),
            status,
            plan_name,
            subscription_id,
            subscription_plan_id,
            checkout_id,
            currency,
            price: unit_price,
            next_bill_date,
            next_payment_amount,
          },
        },
      };
    },
  );
}
async function handleSubscriptionPaymentFailed(event: PSubsPaymentFailed) {
  await billingTransact(event, (state) => {
    const { user_id, email, event_time, currency, checkout_id, status } = event;
    return { ...state };
  });
}

async function handlePayload(payload: PaddlePayload): Promise<void> {
  if (payload.alert_name === "subscription_cancelled") {
    await handleSubscriptionCancelled(payload);
  } else if (payload.alert_name === "subscription_created") {
    await handleSubscriptionCreated(payload);
  } else if (payload.alert_name === "subscription_payment_succeeded") {
    await handleSubscriptionPaymentSucceded(payload);
  } else if (payload.alert_name === "subscription_payment_failed") {
    await handleSubscriptionPaymentFailed(payload);
  } else if (payload.alert_name === "subscription_updated") {
    await handleSubscriptionUpdated(payload);
  } else {
  }
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const isVerified = validateWebhook(req.body);
  const payload: PaddlePayload = req.body;
  handlePayload(payload)
    .then(() => {
      console.log(`Handled Paddle event ${payload.alert_name}: ${payload.alert_id}`);
    })
    .catch((e) => {
      sendEmail(
        "admin@aven.io",
        "Billing Hook Failure",
        `The following event could not be applied: ${JSON.stringify(payload)} ${JSON.stringify(e)}`,
      );
    });
  return {
    message: "Thank you, Paddle.",
  };
});

export default APIHandler;
