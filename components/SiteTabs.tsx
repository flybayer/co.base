import { Tab, TabList, Tabs } from "@chakra-ui/core";
import styled from "@emotion/styled";
import Head from "next/head";
import Link from "next/link";

const TabBarContainer = styled.div`
  display: flex;
  align-items: flex-end;
  margin: 20px 0;
  align-self: stretch;
`;

const TitleContainer = styled.div`
  h2 {
    font-size: 42px;
  }
  flex-grow: 1;
  border-bottom: 2px solid rgb(226, 232, 240);
`;

export function SiteTabs({
  siteName,
  tab,
}: {
  siteName: string;
  tab: "site" | "team" | "api-tokens" | "events";
}) {
  return (
    <TabBarContainer>
      <Head>
        <title>Admin: {siteName}</title>
      </Head>
      <Link href={`/sites/${siteName}`}>
        <TitleContainer>
          <h2>{siteName}</h2>
        </TitleContainer>
      </Link>
      <Tabs
        index={["site", "team", "api-tokens", "events"].findIndex(
          (t) => t === tab
        )}
      >
        <TabList>
          <Link href={`/sites/${siteName}`}>
            <Tab>Site</Tab>
          </Link>
          <Link href={`/sites/${siteName}/team`}>
            <Tab>Team</Tab>
          </Link>
          <Link href={`/sites/${siteName}/api-tokens`}>
            <Tab>API Tokens</Tab>
          </Link>
          <Link href={`/sites/${siteName}/events`}>
            <Tab>Events</Tab>
          </Link>
        </TabList>
      </Tabs>
    </TabBarContainer>
  );
}
