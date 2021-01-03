import { Button } from "@chakra-ui/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../../lib/server/getVerifedUser";
import { APIButton } from "../../../../lib/components/APIButton";
import { CenterButtonRow, MainSection } from "../../../../lib/components/CommonViews";
import { database } from "../../../../lib/data/database";
import { SiteSchema } from "../../../../lib/data/SiteSchema";
import { SiteSettingsPage } from "../../../../lib/components/SiteSettingsPage";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  const siteName = String(context.params?.siteId);
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const site = await database.site.findUnique({ where: { name: siteName }, select: { schema: true } });
  if (!site) return { redirect: { destination: "/account", permanent: false } };
  return {
    props: {
      user: verifiedUser,
      siteName,
      schema: site?.schema || null,
    },
  };
};

export default function SiteTeamPage({
  user,
  siteName,
  schema,
}: {
  user: APIUser;
  siteName: string;
  schema?: SiteSchema;
}): ReactElement {
  const { push } = useRouter();
  return (
    <SiteSettingsPage siteName={siteName} user={user} tab="index">
      <MainSection title="Site Ownership">
        <CenterButtonRow>
          <Button disabled>Transfer to Another User</Button>
        </CenterButtonRow>
      </MainSection>
      <MainSection title="Danger">
        <CenterButtonRow>
          <APIButton
            colorScheme="red"
            endpoint="site-destroy"
            payload={{ siteName }}
            onDone={() => {
              push("/account");
            }}
          >
            Delete Site
          </APIButton>
        </CenterButtonRow>
      </MainSection>
    </SiteSettingsPage>
  );
}
