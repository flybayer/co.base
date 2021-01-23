import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "querystring";

export function authRedirect(
  context: GetServerSidePropsContext<ParsedUrlQuery>,
): { redirect: { destination: string; permanent: boolean } } {
  const destination = `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`;
  return { redirect: { destination, permanent: false } };
}
