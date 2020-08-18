import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Button } from "@blueprintjs/core";
import SiteLayout from "../../components/SiteLayout";
import redirect from "../../api-utils/redirect";
import { destroyCookie } from "nookies";
import Router from "next/router";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifiedUser";

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
      <Button onClick={() => {}}>Set Name</Button>
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
          <form method="POST" action="/api/billing-session">
            <button type="submit" className="bp3-button bp3-intent-primary">
              <span className="bp3-button-text">Manage billing</span>
            </button>
          </form>
          <h3>Account</h3>
          <Button
            onClick={() => {
              destroyCookie(null, "AvenSessionToken");
              fetch("/api/logout")
                .then(() => {
                  Router.push("/login");
                })
                .catch((e) => {
                  console.error(e);
                  alert("whoops!");
                });
            }}
          >
            Log Out
          </Button>
        </>
      }
    />
  );
}
