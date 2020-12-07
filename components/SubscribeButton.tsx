import { Button, Spinner } from "@chakra-ui/core";
import React from "react";
import { SubscriptionLevel, getSubscriptionLevelName } from "../data/subscription";

export default function SubscribeButton({ level }: { level: SubscriptionLevel }) {
  const [isWaiting, setIsWaiting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<null | string>(null);
  const subscribeClick = React.useCallback(() => {
    const getStripe = import("../client-utils/stripe").then((module) => module.stripePromise);
    const getCheckoutSession = fetch(`/api/billing-subscribe?level=${level}`, {}).then((resp) => resp.json());
    setIsWaiting(true);
    Promise.all([getStripe, getCheckoutSession])
      .then(([stripe, checkoutSession]) => {
        if (!stripe) {
          throw Error("Cannot prepare the stripe client");
        }
        return stripe.redirectToCheckout({
          sessionId: checkoutSession.id,
        });
      })
      .then(({ error }) => {
        if (error) {
          setErrorText("Something went wrong! Please contact support@aven.io");
        }
      })
      .catch((e) => {
        console.error("Subscription Error!", e);
        setErrorText("Something went wrong! Please contact support@aven.io");
      })
      .finally(() => {
        setIsWaiting(false);
      });
  }, []);
  return (
    <div style={{ display: "flex" }}>
      <Button onClick={subscribeClick}>Subscribe - {getSubscriptionLevelName(level)}</Button>
      {errorText && <p style={{ margin: "4px 16px" }}>{errorText}</p>}
      <span style={{ padding: "4px 16px 0", color: "#933" }}>{isWaiting && <Spinner size="sm" />}</span>
    </div>
  );
}
