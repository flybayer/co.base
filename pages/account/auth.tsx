import { GetServerSideProps } from "next";
import { destroyCookie } from "nookies";
import { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { LinkButton } from "../../lib/components/Buttons";
import { Button, Spinner } from "@chakra-ui/core";
import Link from "next/link";
import { database } from "../../lib/data/database";
import { api } from "../../lib/server/api";
import { ReactElement, useState } from "react";
import { CenterButtonRow, MainSection } from "../../lib/components/CommonViews";
import { AccountPage } from "../../lib/components/AccountPage";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const fullUser = await database.user.findUnique({
    where: { id: verifiedUser.id },
    include: {
      VerifiedEmail: { select: { email: true } },
      EmailValidation: { select: { email: true } },
    },
  });

  return {
    props: {
      user: verifiedUser,
      emails: [
        { primary: true, email: verifiedUser.email },
        ...(fullUser?.VerifiedEmail.filter((e) => e.email !== verifiedUser.email).map((verifiedEmail) => {
          return { email: verifiedEmail.email };
        }) || []),
        ...(fullUser?.EmailValidation.map((unverifiedEmail) => {
          return { email: unverifiedEmail.email, unverified: true };
        }) || []),
      ],
    },
  };
};

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

export default function AccountIndexPage({
  user,
  emails,
}: {
  user: APIUser;
  emails: Array<{ email: string; primary?: true; unverified?: true }>;
}): ReactElement {
  const { push } = useRouter();
  return (
    <AccountPage tab="auth" user={user}>
      <MainSection title="Auth">
        <PasswordBox user={user} />
      </MainSection>
      <MainSection title="Email">
        {emails.map(({ email, unverified, primary }) => (
          <div key={email}>
            {email} {unverified && "(unverified)"}
            {primary && "(primary)"}
            {/* {!unverified && !primary && <MakePrimaryEmailButton email={email} />} */}
            {!primary && <DeleteEmailButton email={email} />}
          </div>
        ))}
        <LinkButton href={`/account/add-email`}>Add Email</LinkButton>
      </MainSection>
      <MainSection title="Account">
        <CenterButtonRow>
          <Button
            onClick={() => {
              console.log("LogOut00");
              destroyCookie(null, "AvenSession");
              console.log("LogOut01");
              setTimeout(() => {
                push("/login");
                console.log("LogOut02");
              }, 10);
            }}
          >
            Log Out
          </Button>
          <LinkButton colorScheme="red" href={"/account/destroy"}>
            Delete Account
          </LinkButton>
        </CenterButtonRow>
      </MainSection>
    </AccountPage>
  );
}
