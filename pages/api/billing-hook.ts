import { readSignedWebhook } from "../../api-utils/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import bodyParser from "body-parser";
import { apiRespond } from "../../api-utils/apiRespond";
import { Error400 } from "../../api-utils/Errors";
import notifyAdministrator from "../../api-utils/notifyAdministrator";

const eventTypeHandlers: Record<string, (event: any) => any> = {
  "customer.created": (event: any) => {
    console.log("Customer created:");
    return {};
  },
};

async function handleAction(req: NextApiRequest, res: NextApiResponse) {
  const signature = req.headers["stripe-signature"];
  const event = readSignedWebhook(req.body, signature);

  if (event.object !== "event") {
    throw new Error400({ message: 'Expected an object of type "event"' });
  }
  if (eventTypeHandlers[event.type]) {
    await eventTypeHandlers[event.type](event);
  } else {
    console.log("Unhandled stripe event: ", event.type);
    console.log(JSON.stringify(event));
    await notifyAdministrator(
      "Unknown Stripe Webhook",
      JSON.stringify(event, null, 2)
    );
  }
  return {
    message: "Thank you, Stripe.",
  };
}

const reader = bodyParser.raw({ type: "application/json" });

export default (req: NextApiRequest, res: NextApiResponse) => {
  reader(req, res, () => {
    apiRespond(res, handleAction(req, res));
  });
};

export const config = {
  api: {
    bodyParser: false,
  },
};
