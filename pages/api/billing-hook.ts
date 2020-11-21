import { readSignedWebhook } from "../../api-utils/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import bodyParser from "body-parser";
import { Error400 } from "../../api-utils/Errors";
import {
  StripeSubscriptionCreatedEvent,
  syncSubscription,
  StripeSubscriptionUpdatedEvent,
} from "../../api-utils/billing";
import { createAPI } from "../../api-utils/createAPI";

// stripe listen --forward-to localhost:3001/api/billing-hook

const eventTypeHandlers: Record<string, (event: any) => Promise<any>> = {
  "customer.created": async (event: any) => {
    console.log("Customer created:");
    return {};
  },
  "customer.subscription.created": async (
    event: StripeSubscriptionCreatedEvent
  ) => {
    const subscription = event.data.object;
    await syncSubscription(subscription);
  },
  "customer.subscription.updated": async (
    event: StripeSubscriptionUpdatedEvent
  ) => {
    const subscription = event.data.object;
    await syncSubscription(subscription);
  },
};

const reader = bodyParser.raw({ type: "application/json" });

export const config = {
  api: {
    bodyParser: false,
  },
};

const APIHandler = createAPI(
  async (req: NextApiRequest, res: NextApiResponse) => {
    await new Promise((resolve) => reader(req, res, resolve));
    const signature = req.headers["stripe-signature"];
    const event = readSignedWebhook(req.body, signature);

    if (event.object !== "event") {
      throw new Error400({
        message: 'Expected an object of type "event"',
        name: "UnexpectedEventType",
      });
    }
    if (eventTypeHandlers[event.type]) {
      await eventTypeHandlers[event.type](event);
    } else {
      console.log("Unhandled stripe event: ", event.type);
    }
    return {
      message: "Thank you, Stripe.",
    };
  }
);

export default APIHandler;
