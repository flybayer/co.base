// import { database } from "../../../data/database";

import { GetServerSideProps } from "next";
import { database } from "../../../data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await database.user.findOne({
    where: { username: context.params.userId as string },
  });

  return { props: { user } };
};

export default function UserPage({ user }) {
  return <div>{JSON.stringify(user)}</div>;
}
