import { Button } from "@chakra-ui/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { APIButton } from "../../../components/APIButton";
import { CenterButtonRow, MainSection } from "../../../components/CommonViews";
import SiteLayout, { BasicSiteLayout } from "../../../components/SiteLayout";
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
  const site = await database.site.findOne({ where: { name: siteName } });
  return {
    props: {
      user: verifiedUser,
      siteName,
    },
  };
};

export default function SiteTeamPage({
  user,
  siteName,
}: {
  user: APIUser;
  siteName: string;
}) {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="settings" siteName={siteName} />
          <MainSection title="Site Access">
            <CenterButtonRow>
              <Button disabled>Make Site Public</Button>
            </CenterButtonRow>
          </MainSection>
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
                payload={{ name: siteName }}
                onDone={() => {
                  push("/account");
                }}
              >
                Delete Site
              </APIButton>
            </CenterButtonRow>
          </MainSection>
        </>
      }
    />
  );
}
