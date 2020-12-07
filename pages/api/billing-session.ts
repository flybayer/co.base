import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import stripe from "../../api-utils/stripe";
import getSiteLink from "../../api-utils/getSiteLink";
import { createAPI } from "../../api-utils/createAPI";

async function redirectBillingSession(user: APIUser, res: NextApiResponse) {
  let stripeCustomer = user.stripeCustomerId;
  if (!stripeCustomer) {
    const customer = await stripe.customers.create({
      metadata: {
        userId: user.id,
      },
      email: user.email,
    });
    await database.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
    stripeCustomer = customer.id;
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomer,
    return_url: getSiteLink("/account"),
  });
  if (session && session.url) {
    redirect(res, session.url);
  }
  return {};
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req);
  if (verifiedUser == null) {
    redirect(res, "/login");
    return {};
  } else {
    return await redirectBillingSession(verifiedUser, res);
  }
});

export default APIHandler;
