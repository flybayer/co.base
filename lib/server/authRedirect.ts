import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "querystring";

export function authRedirect(
  context: GetServerSidePropsContext<ParsedUrlQuery>,
): { redirect: { destination: string; permanent: boolean } } {
  console.log(context.resolvedUrl);
  // context.query.
  return { redirect: { destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`, permanent: false } };
}
