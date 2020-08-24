import SiteLayout from "../../components/SiteLayout";
import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getVerifiedUser(context.req);
  return { props: { user } };
};

export default function WelcomePage({ user }: { user: APIUser }) {
  const accessLevel = user?.subscribedAccess || 0;
  return (
    <SiteLayout
      content={
        <>
          <h2>Welcome, you are subscribed!</h2>
          <h3>Access Level: {accessLevel}</h3>
        </>
      }
    />
  );
}
