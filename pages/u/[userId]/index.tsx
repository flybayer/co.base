// import { database } from "../../../data/database";

import { GetServerSideProps } from "next";
import { database } from "../../../data/database";
import { User } from "@prisma/client";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const username = context?.params?.userId;
  if (!username) {
    throw Error("Cant look up no user");
  }
  const user = await database.user.findOne({
    where: { username: String(username) },
  });

  return { props: { user } };
};

export default function UserPage({ user }: { user: User }) {
  return <div>{JSON.stringify(user)}</div>;
}
