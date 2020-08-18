import { GetServerSideProps } from "next";
import { database } from "../../data/database";
import { parseCookies } from "nookies";
import { Button } from "@blueprintjs/core";
import SiteLayout from "../../components/SiteLayout";
import redirect from "../../api-utils/redirect";
import { destroyCookie } from "nookies";
import Router from "next/router";

type AccountScreenUser = {
  email: string;
  name: string | null;
  username: string;
  giftedAccess: number;
  subscribedAccess: number;
  hasPassword: boolean;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = parseCookies({ req: context.req });
  const { AvenSessionToken } = cookies;
  if (!AvenSessionToken) {
    redirect(context, "/login");
  }
  const session = await database.session.findOne({
    where: { token: AvenSessionToken },
    select: {
      verifiedUser: {
        select: {
          email: true,
          name: true,
          username: true,
          giftedAccess: true,
          subscribedAccess: true,
          passwordSalt: true,
        },
      },
    },
  });
  const hasPassword = !!session?.verifiedUser?.passwordSalt;
  let user: null | AccountScreenUser = null;
  if (session?.verifiedUser) {
    const {
      email,
      name,
      username,
      giftedAccess,
      subscribedAccess,
    } = session.verifiedUser;
    user = {
      email,
      name,
      username,
      giftedAccess,
      subscribedAccess,
      hasPassword,
    };
  }
  if (!user) {
    redirect(context, "/login");
  }
  return {
    props: {
      user,
    },
  };
};

function UserName({ user }: { user: AccountScreenUser }) {
  return (
    <>
      <h2>Account: {user.username}</h2>
      <Button onClick={() => {}}>Change Username</Button>
    </>
  );
}

function NameBox({ user }: { user: AccountScreenUser }) {
  return (
    <>
      <h3>Name</h3>
      <p>{user.name}</p>
      <Button onClick={() => {}}>Set Name</Button>
    </>
  );
}

function PasswordBox({ user }: { user: AccountScreenUser }) {
  return (
    <>
      <h3>Password</h3>
      <div>{user.hasPassword ? "PW is set" : "No pw set"}</div>
      <Button onClick={() => {}}>Set Password</Button>
    </>
  );
}

export default function accountPage({ user }: { user: AccountScreenUser }) {
  return (
    <SiteLayout
      content={
        <>
          <UserName user={user} />
          <NameBox user={user} />
          <PasswordBox user={user} />
          <h3>Email</h3>
          <div>{user.email}</div>
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
