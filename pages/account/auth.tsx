import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { LinkButton } from "../../lib/components/Buttons";
import { database } from "../../lib/data/database";
import { ReactElement, useState } from "react";
import { CenterButtonRow, MainSection } from "../../lib/components/CommonViews";
import { AccountPage } from "../../lib/components/AccountPage";
import { SetPasswordButton } from "../../lib/components/SetPassword";
import { AddEmailButton } from "../../lib/components/AddEmail";
import { APIButton } from "../../lib/components/APIButton";

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
      <SetPasswordButton />
    </>
  );
}

function DeleteEmailButton({ email, onDeleted }: { email: string; onDeleted: () => void }) {
  return (
    <APIButton colorScheme="red" endpoint="account-delete-email" payload={{ email }} onDone={onDeleted}>
      Delete
    </APIButton>
  );
}

function EmailRow({
  email,
  unverified,
  primary,
}: {
  email: string;
  unverified?: true;
  primary?: true;
}): ReactElement | null {
  const [isDeleted, setIsDeleted] = useState(false);
  if (isDeleted) return null;
  return (
    <div>
      {email} {unverified && "(unverified)"}
      {primary && "(primary)"}
      {!primary && (
        <DeleteEmailButton
          email={email}
          onDeleted={() => {
            setIsDeleted(true);
          }}
        />
      )}
    </div>
  );
}

function EmailsSection({ emails }: { emails: Array<{ email: string; unverified?: true; primary?: true }> }) {
  const [localEmails, setLocalEmails] = useState(emails);
  return (
    <MainSection title="Email">
      {localEmails.map((row) => (
        <EmailRow key={row.email} {...row} />
      ))}
      <AddEmailButton
        onNewEmail={(email) => {
          setLocalEmails([...localEmails, { email, unverified: true }]);
        }}
      />
    </MainSection>
  );
}

export default function AccountIndexPage({
  user,
  emails,
}: {
  user: APIUser;
  emails: Array<{ email: string; primary?: true; unverified?: true }>;
}): ReactElement {
  return (
    <AccountPage tab="auth" user={user}>
      <MainSection title="Auth">
        <PasswordBox user={user} />
      </MainSection>
      <EmailsSection emails={emails} />
      <MainSection title="Account">
        <CenterButtonRow>
          <LinkButton colorScheme="red" href={"/account/destroy"}>
            Delete Account
          </LinkButton>
        </CenterButtonRow>
      </MainSection>
    </AccountPage>
  );
}
