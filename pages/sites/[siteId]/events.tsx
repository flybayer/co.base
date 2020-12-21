import { Text } from "@chakra-ui/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { SiteTabs } from "../../../components/SiteTabs";
import { database } from "../../../data/database";

const PAGE_SIZE = 30;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = String(context.params?.siteId);
  const page = context.query.p ? Number(context.query.p) : 1;
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const evtCount = await database.siteEvent.count({
    where: { site: { name: siteName } },
  });
  const site = await database.site.findUnique({
    where: { name: siteName },
    select: {
      SiteEvent: {
        skip: PAGE_SIZE * (page - 1),
        take: PAGE_SIZE + 1,
        orderBy: { completeTime: "desc" },
        select: {
          id: true,
          eventName: true,
          address: true,
          completeTime: true,
          user: {
            select: {
              name: true,
              email: true,
              username: true,
            },
          },
        },
      },
    },
  });
  if (!site) return { redirect: { destination: "/account", permanent: false } };
  return {
    props: {
      user: verifiedUser,
      siteName,
      evtCount,
      events: site?.SiteEvent.map((e) => ({
        user: e.user,
        eventName: e.eventName,
        address: e.address,
        completeTime: e.completeTime.toISOString(),
      })),
    },
  };
};

export default function SiteTeamPage({
  user,
  siteName,
  events,
  evtCount,
}: {
  user: APIUser;
  siteName: string;
  evtCount: any;
  events: Array<{
    id: true;
    eventName: string;
    address: string[];
    completeTime: string;
    user: {
      name: string;
      email: string;
      username: string;
    };
  }>;
}): ReactElement {
  const { push } = useRouter();
  console.log(events, evtCount);

  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <SiteTabs tab="events" siteName={siteName} />
          {events.map((event) => (
            <>
              <Text>
                {event.user.email} - {event.eventName} {event.completeTime}
              </Text>
            </>
          ))}
        </>
      }
    />
  );
}
