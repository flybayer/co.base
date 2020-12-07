import { push } from "all-the-cities";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { APIButton } from "../../../components/APIButton";
import { MainSection } from "../../../components/CommonViews";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { database } from "../../../data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = context.params?.siteName;
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const sites = await database.site.findMany({
    where: { owner: { id: verifiedUser?.id } },
    select: { name: true, id: true },
  });
  const userWithEmails = await database.user.findUnique({
    where: { id: verifiedUser.id },
    include: {
      VerifiedEmail: { select: { email: true } },
      EmailValidation: { select: { email: true } },
    },
  });
  return {
    props: {
      user: verifiedUser,
      siteName,
    },
  };
};

export default function siteInvitePage({ user, siteName }: { user: APIUser; siteName: string }) {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      content={
        <>
          <MainSection title={`Invite to ${siteName}`}>
            Click to accept:{" "}
            <APIButton
              endpoint="site-role-accept"
              payload={{ siteName }}
              onDone={() => {
                push(`/sites/${siteName}`);
              }}
            >
              Join {siteName}
            </APIButton>
          </MainSection>
        </>
      }
    />
  );
}
