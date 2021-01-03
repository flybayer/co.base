import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { Text } from "@chakra-ui/core";
import { database } from "../../lib/data/database";
import { ReactElement } from "react";
import { MainSection } from "../../lib/components/CommonViews";
import { DevPreviewSubscribeButton } from "../../lib/components/Paddle";
import { BillingState } from "../api/billing-hook";
import { AccountPage } from "../../lib/components/AccountPage";
import { UserPrivilege } from "@prisma/client";
import { LinkButton } from "../../lib/components/Buttons";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const fullUser = await database.user.findUnique({
    where: { id: verifiedUser.id },
    select: {
      billing: true,
      privilege: true,
    },
  });

  return {
    props: {
      user: verifiedUser,
      billingState: fullUser?.billing,
      privilege: fullUser?.privilege || UserPrivilege.NONE,
    },
  };
};

export default function BillingPage({
  user,
  billingState,
  privilege,
}: {
  user: APIUser;
  billingState?: BillingState;
  privilege: UserPrivilege;
}): ReactElement {
  const { push } = useRouter();
  return (
    <AccountPage tab="billing" user={user}>
      <MainSection title="Plan">
        <p>You are a {UserPrivilege[privilege]}</p>
        <DevPreviewSubscribeButton user={user} />
        {Object.values(billingState?.subscriptions || {}).map((sub) => (
          <div key={sub.subscription_id}>
            <Text>
              {sub.plan_name}({sub.status}) - {sub.price} {sub.currency} -{JSON.stringify(sub)}
            </Text>
            {sub.cancel_url && (
              <LinkButton href={sub.cancel_url} colorScheme="red">
                Cancel Subscription
              </LinkButton>
            )}
            {sub.update_url && <LinkButton href={sub.update_url}>Update Subscription</LinkButton>}
          </div>
        ))}
      </MainSection>
      {billingState?.receipts?.length && (
        <MainSection title="Receipts">
          {billingState?.receipts?.map((receipt) => (
            <div key={receipt.url}>
              {receipt.amount} {receipt.currency} {receipt.date}
              <LinkButton href={receipt.url}></LinkButton>
            </div>
          ))}
        </MainSection>
      )}
    </AccountPage>
  );
}
