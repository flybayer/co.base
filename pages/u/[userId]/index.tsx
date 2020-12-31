// import { database } from "../../../data/database";

import { GetServerSideProps } from "next";
import { database } from "../../../lib/data/database";
import { ReactElement } from "react";
import { BasicSiteLayout } from "../../../lib/components/SiteLayout";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const username = context?.params?.userId;
  if (!username) {
    throw Error("Cant look up no user");
  }
  const user = await database.user.findUnique({
    where: { username: String(username) },
    select: { name: true, username: true },
  });

  return { props: { user } };
};

export default function UserPage({ user }: { user: { name: string; username: string } }): ReactElement {
  return <BasicSiteLayout title={`@${user.username}`} content={<p>{user.name}</p>} />;
}
