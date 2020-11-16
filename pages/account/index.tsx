import { GetServerSideProps, GetServerSidePropsContext } from "next";
import SiteLayout from "../../components/SiteLayout";
import redirect from "../../api-utils/redirect";
import { destroyCookie } from "nookies";
import Router, { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import PostButton, { LinkButton } from "../../components/PostButton";
import { Button, Spinner } from "@chakra-ui/core";
import Link from "next/link";
import { database } from "../../data/database";
import styled from "@emotion/styled";
import { api } from "../../api-utils/api";
import { useState } from "react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const sites = await database.site.findMany({
    where: { owner: { id: verifiedUser?.id } },
    select: { name: true, id: true },
  });
  const userWithEmails = await database.user.findOne({
    where: { id: verifiedUser.id },
    include: {
      VerifiedEmail: { select: { email: true } },
      EmailValidation: { select: { email: true } },
    },
  });
  return {
    props: {
      sites,
      user: verifiedUser,
      emails: [
        { primary: true, email: verifiedUser.email },
        ...(userWithEmails?.VerifiedEmail.filter(
          (e) => e.email !== verifiedUser.email
        ).map((verifiedEmail) => {
          return { email: verifiedEmail.email };
        }) || []),
        ...(userWithEmails?.EmailValidation.map((unverifiedEmail) => {
          return { email: unverifiedEmail.email, unverified: true };
        }) || []),
      ],
    },
  };
};

function UserName({ user }: { user: APIUser }) {
  return (
    <>
      <h2>Account: {user.username}</h2>
      <LinkButton href="/account/set-username">Set Username</LinkButton>
    </>
  );
}

function NameBox({ user }: { user: APIUser }) {
  return (
    <>
      <h3>Name</h3>
      <p>{user.name}</p>
      <LinkButton href="/account/set-name">Set Name</LinkButton>
    </>
  );
}

function PasswordBox({ user }: { user: APIUser }) {
  return (
    <>
      <h3>Password</h3>
      <div>{user.hasPassword ? "PW is set" : "No pw set"}</div>
      <Link href="/account/set-password">
        <Button>Set Password</Button>
      </Link>
    </>
  );
}

const SiteContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;

  h3 {
    font-size: 32px;
  }
`;

function MakePrimaryEmailButton({ email }: { email: string }) {
  const [isSpin, setIsSpin] = useState(false);
  const { reload } = useRouter();
  return (
    <Button
      onClick={() => {
        setIsSpin(true);
        api("account-primary-email", { email })
          .then(reload)
          .catch(console.error)
          .finally(() => {
            setIsSpin(false);
          });
      }}
    >
      Set Primary Email {isSpin && <Spinner size="sm" />}
    </Button>
  );
}

function DeleteEmailButton({ email }: { email: string }) {
  const [isSpin, setIsSpin] = useState(false);
  const { reload } = useRouter();
  return (
    <Button
      colorScheme="red"
      onClick={() => {
        setIsSpin(true);
        api("account-delete-email", { email })
          .then(reload)
          .catch(console.error)
          .finally(() => {
            setIsSpin(false);
          });
      }}
    >
      Delete {isSpin && <Spinner size="sm" />}
    </Button>
  );
}

export default function accountPage({
  user,
  sites,
  emails,
}: {
  user: APIUser;
  sites: Array<{ id: number; name: string }>;
  emails: Array<{ email: string; primary?: true; unverified?: true }>;
}) {
  return (
    <SiteLayout
      content={
        <>
          <UserName user={user} />
          <NameBox user={user} />
          <PasswordBox user={user} />
          <h3>Email</h3>
          {emails.map(({ email, unverified, primary }) => (
            <div>
              {email} {unverified && "(unverified)"}
              {primary && "(primary)"}
              {!unverified && !primary && (
                <MakePrimaryEmailButton email={email} />
              )}
              {!primary && <DeleteEmailButton email={email} />}
            </div>
          ))}
          <LinkButton href={`/account/add-email`}>Add Email</LinkButton>
          <h3>Billing</h3>
          <PostButton action="/api/billing-session" primary>
            Manage billing
          </PostButton>
          {sites.map((site) => (
            <Link href={`/sites/${site.name}`}>
              <SiteContainer>
                <h3>{site.name}</h3>
                <Link href={`/sites/${site.name}/dashboard`}>
                  <Button colorScheme="green">Dashboard</Button>
                </Link>
                <Link href={`/sites/${site.name}`}>
                  <Button>Settings</Button>
                </Link>
              </SiteContainer>
            </Link>
          ))}
          <Link href={`/account/new-site`}>
            <Button colorScheme="green">New Site</Button>
          </Link>
          <h3>Account</h3>
          <Button
            onClick={() => {
              destroyCookie(null, "AvenSession");
              Router.push("/login");
            }}
          >
            Log Out
          </Button>
          <LinkButton colorScheme="red" href={"/account/destroy"}>
            Delete Account
          </LinkButton>
        </>
      }
    />
  );
}
