import createLayout from "./createLayout";
import { GetServerSideProps } from "next";
import getVerifiedUser from "../api-utils/getVerifedUser";

export const getServerSideProps: GetServerSideProps = async (context) => {
  console.log("hwyeyyyy");
  const user = await getVerifiedUser(context);
  return { props: { user } };
};

export default function layout(frontMatter: any) {
  return createLayout(frontMatter, {});
}
