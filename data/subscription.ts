import { Error500 } from "../api-utils/Errors";
import { PojoMap } from "pojo-maps";

export enum SubscriptionLevel {
  None,
  Insider,
  Contributor,
  VIP,
}

export function getSubscriptionLevelName(level: SubscriptionLevel): string {
  switch (level) {
    case SubscriptionLevel.Insider:
      return "Insider";
    case SubscriptionLevel.Contributor:
      return "Contributor";
    case SubscriptionLevel.VIP:
      return "VIP";
    default:
      return "Unknown";
  }
}

const STRIPE_PRODUCTS_DEV: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Insider]: "prod_HsOAaLiTYtEGa3",
  [SubscriptionLevel.Contributor]: "prod_HsO9bFB0NmddAA",
  [SubscriptionLevel.VIP]: "prod_HsO9bFB0NmddAA",
};

const STRIPE_PRODUCTS_LIVE: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Insider]: "prod_HqholNZ7iREoQb",
  [SubscriptionLevel.Contributor]: "prod_Hqhp6Fnl9hGEAa",
  [SubscriptionLevel.VIP]: "prod_HqhsSpoi7JE4kA",
};

const STRIPE_PRICES_LIVE: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Insider]: "price_0HH0OV05C7xNwv0sRGr8iGBD",
  [SubscriptionLevel.Contributor]: "price_0HH0Q205C7xNwv0s3hhBYypY",
  [SubscriptionLevel.VIP]: "price_0HH0Sg05C7xNwv0sskcjQvt3",
};

const STRIPE_PRICES_DEV: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Insider]: "price_0HIdNr05C7xNwv0sWxrtaG5p",
  [SubscriptionLevel.Contributor]: "price_0HIdNH05C7xNwv0skHTdLOgr",
  [SubscriptionLevel.VIP]: "price_0HHBXS05C7xNwv0sUvV4EcJc",
};

const dev = process.env.NODE_ENV !== "production";
const stripeProducts = dev ? STRIPE_PRODUCTS_DEV : STRIPE_PRODUCTS_LIVE;
const stripePrices = dev ? STRIPE_PRICES_DEV : STRIPE_PRICES_LIVE;
const stripeProductEntries = PojoMap.entries(stripeProducts);

export function getPriceIdOfSubscriptionLevel(
  level: SubscriptionLevel
): string {
  const plan = stripePrices[level];
  if (plan) {
    return plan;
  }
  throw new Error500({ message: "Unknown Product" });
}

export function getLevelOfProductId(productId: string): SubscriptionLevel {
  const entry = stripeProductEntries.find(
    ([_, p]: [SubscriptionLevel, string]) => p === productId
  );
  if (entry) {
    return Number(entry[0]);
  }
  throw new Error500({ message: "Product not found!", field: productId });
}
