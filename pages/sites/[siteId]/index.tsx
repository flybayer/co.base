import { Button } from "@chakra-ui/core";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { api } from "../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import DashboardBreadcrumbs from "../../../components/DashboardBreadcrumbs";
import SiteLayout from "../../../components/SiteLayout";
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

export default function SiteSettingsPage({
  user,
  siteName,
}: {
  user: APIUser;
  siteName: string;
}) {
  const { push } = useRouter();
  return (
    <SiteLayout
      content={
        <>
          <DashboardBreadcrumbs
            siteName={siteName}
            address={[]}
            nodeFeature="Settings"
          />
          <h3>Site Settings: {siteName}</h3>
          <Button
            colorScheme="red"
            onClick={() => {
              api("site-destroy", { name: siteName }).then(() => {
                push("/account");
              });
            }}
          >
            Delete Site
          </Button>
        </>
      }
    />
  );
}
