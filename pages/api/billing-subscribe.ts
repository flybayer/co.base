import stripe from "../../api-utils/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import redirect from "../../api-utils/redirect";
import getSiteLink from "../../api-utils/getSiteLink";
import { apiRespond } from "../../api-utils/apiRespond";
import { Error500 } from "../../api-utils/Errors";
import { SubscriptionLevel } from "../../data/subscription";

function getPriceIdOfSubscriptionLevel(level: SubscriptionLevel): string {
  if (process.env.NODE_ENV === "production") {
    switch (level) {
      case SubscriptionLevel.Insider:
        return "price_0HH0OV05C7xNwv0sRGr8iGBD";
      case SubscriptionLevel.Contributor:
        return "price_0HH0Q205C7xNwv0s3hhBYypY";
      case SubscriptionLevel.VIP:
        return "price_0HH0Sg05C7xNwv0sskcjQvt3";
      default: {
        throw new Error500({ message: "Unknown Product" });
      }
    }
  } else {
    // TEST MODE PRODUCTS:
    switch (level) {
      case SubscriptionLevel.Insider:
        return "price_0HIdNr05C7xNwv0sWxrtaG5p";
      case SubscriptionLevel.Contributor:
        return "price_0HIdNH05C7xNwv0skHTdLOgr";
      case SubscriptionLevel.VIP:
        return "price_0HHBXS05C7xNwv0sUvV4EcJc";
      default: {
        throw new Error500({ message: "Unknown Product" });
      }
    }
  }
}
async function redirectBillingSubscribe(
  verifiedUser: APIUser | null,
  level: SubscriptionLevel,
  res: NextApiResponse
) {
  if (!verifiedUser) {
    return {};
  }
  const existingCustomer = verifiedUser.stripeCustomerId
    ? {
        customer: verifiedUser.stripeCustomerId,
      }
    : {
        customer_email: verifiedUser.email,
      };
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
    cancel_url: getSiteLink("/insiders-edition"),
    ...existingCustomer,
  });
  return session;
}

async function handleAction(req: NextApiRequest, res: NextApiResponse) {
  const verifiedUser = await getVerifiedUser(req);
  if (verifiedUser == null) {
    redirect(res, "/login");
    return {};
  } else {
    return await redirectBillingSubscribe(
      verifiedUser,
      Number(req.query.level),
      res
    );
  }
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  apiRespond(res, handleAction(req, res));
};
