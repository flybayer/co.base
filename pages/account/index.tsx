import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Button } from "@blueprintjs/core";
import SiteLayout from "../../components/SiteLayout";
import redirect from "../../api-utils/redirect";
import { destroyCookie } from "nookies";
import Router from "next/router";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import PostButton from "../../components/PostButton";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  if (!verifiedUser) {
    redirect(context.res, "/login");
  }
  return {
    props: {
      user: verifiedUser,
    },
  };
};

function UserName({ user }: { user: APIUser }) {
  return (
    <>
      <h2>Account: {user.username}</h2>
      <Button onClick={() => {}}>Change Username</Button>
    </>
  );
}

function NameBox({ user }: { user: APIUser }) {
  return (
    <>
      <h3>Name</h3>
      <p>{user.name}</p>
      <PostButton method="GET" action="/account/set-name">
        Set Name
      </PostButton>
    </>
  );
}

function PasswordBox({ user }: { user: APIUser }) {
  return (
    <>
      <h3>Password</h3>
      <div>{user.hasPassword ? "PW is set" : "No pw set"}</div>
      <Button onClick={() => {}}>Set Password</Button>
    </>
  );
}

export default function accountPage({ user }: { user: APIUser }) {
  return (
    <SiteLayout
      content={
        <>
          <UserName user={user} />
          <NameBox user={user} />
          <PasswordBox user={user} />
          <h3>Email</h3>
          <div>{user.email}</div>
          <h3>Billing</h3>
          <PostButton action="/api/billing-session" primary>
            Manage billing
          </PostButton>
          <h3>Account</h3>
          <Button
            onClick={() => {
              destroyCookie(null, "AvenSession");
              Router.push("/login");
            }}
          >
            Log Out
          </Button>
        </>
      }
    />
  );
}
