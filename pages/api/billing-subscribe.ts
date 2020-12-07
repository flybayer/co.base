import stripe from "../../api-utils/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import redirect from "../../api-utils/redirect";
import getSiteLink from "../../api-utils/getSiteLink";
import { SubscriptionLevel, getPriceIdOfSubscriptionLevel } from "../../data/subscription";
import { createAPI } from "../../api-utils/createAPI";
import { Error500 } from "../../api-utils/Errors";

async function redirectBillingSubscribe(verifiedUser: APIUser | null, level: SubscriptionLevel, res: NextApiResponse) {
  if (!verifiedUser) {
    return {};
  }
  if (!stripe) throw new Error500({ name: "SripeNotReady" });
  const existingCustomerId = verifiedUser.stripeCustomerId;
  let newCustomer = null;
  if (!existingCustomerId && verifiedUser.email) {
    newCustomer = await stripe.customers.create({
      email: verifiedUser.email,
      metadata: {
        // ideally we would just make one "session.create" request to stripe, which will automatically create a customer. But we need to have a customer.metadata.id, so we make the customer ourself before the checkout session
        userId: verifiedUser.id,
      },
    });
  }
  const customerId = existingCustomerId || newCustomer?.id;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: getPriceIdOfSubscriptionLevel(level),
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: getSiteLink("/account/welcome"),
    cancel_url: getSiteLink("/pricing"),
    customer: customerId,
  });
  return session;
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (verifiedUser == null) {
    redirect(res, "/login");
    return {};
  } else {
    return await redirectBillingSubscribe(verifiedUser, Number(req.query.level), res);
  }
});

export default APIHandler;
