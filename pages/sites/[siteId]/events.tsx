import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { SiteTabs } from "../../../components/SiteTabs";
import { database } from "../../../data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = String(context.params?.siteId);
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const site = await database.site.findUnique({ where: { name: siteName } });
  return {
    props: {
      user: verifiedUser,
      siteName,
    },
  };
};

export default function SiteTeamPage({ user, siteName }: { user: APIUser; siteName: string }): ReactElement {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <SiteTabs tab="events" siteName={siteName} />
        </>
      }
    />
  );
}
