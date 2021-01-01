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
    },
  };
};

export default function BillingPage({
  user,
  billingState,
}: {
  user: APIUser;
  billingState: BillingState;
}): ReactElement {
  const { push } = useRouter();
  return (
    <AccountPage tab="billing" user={user}>
      <MainSection title="Billing">
        <DevPreviewSubscribeButton user={user} />
        <Text>{JSON.stringify(billingState)}</Text>
      </MainSection>
    </AccountPage>
  );
}
