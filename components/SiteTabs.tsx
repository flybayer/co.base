import { Tab, TabList, Tabs } from "@chakra-ui/core";
import styled from "@emotion/styled";
import Head from "next/head";
import Link from "next/link";
import { explodeAddress } from "../api-utils/explodeAddress";

const TabBarContainer = styled.div`
  display: flex;
  align-items: flex-end;
  align-self: stretch;
`;

const TitleContainer = styled.div`
  h2 {
    font-size: 42px;
    margin: 0;
    margin-top: -20px;
  }
  flex-grow: 1;
  border-bottom: 2px solid rgb(226, 232, 240);
`;

const HeaderA = styled.a`
  font-size: 32px;
  color: #222;
  :hover {
    color: #666;
  }
`;
function HeaderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} passHref>
      <HeaderA>{label}</HeaderA>
    </Link>
  );
}

export function SiteTabs({
  siteName,
  tab,
  address,
}: {
  siteName: string;
  tab:
    | "site"
    | "team"
    | "api-tokens"
    | "events"
    | "settings"
    | "data"
    | "options"
    | "schema";
  address?: string[];
}) {
  let tabs = (
    <Tabs
      index={["site", "team", "api-tokens", "events", "settings"].findIndex(
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
        <Link href={`/sites/${siteName}/settings`}>
          <Tab>Settings</Tab>
        </Link>
      </TabList>
    </Tabs>
  );
  if (address?.length) {
    tabs = (
      <Tabs index={["data", "schema", "options"].findIndex((t) => t === tab)}>
        <TabList>
          <Link href={`/sites/${siteName}/dashboard/${address.join("/")}`}>
            <Tab>Data</Tab>
          </Link>
          <Link href={`/sites/${siteName}/schema/${address.join("/")}`}>
            <Tab>Schema</Tab>
          </Link>
          <Link href={`/sites/${siteName}/options/${address.join("/")}`}>
            <Tab>Options</Tab>
          </Link>
        </TabList>
      </Tabs>
    );
  }
  return (
    <TabBarContainer>
      <Head>
        <title>Admin: {siteName}</title>
      </Head>
      <TitleContainer>
        <HeaderLink href={`/sites/${siteName}`} label={siteName} />
        {explodeAddress(address).map(({ key, fullAddress }) => (
          <HeaderLink
            href={`/sites/${siteName}/dashboard${fullAddress}`}
            label={`/${key}`}
          />
        ))}
      </TitleContainer>
      {tabs}
    </TabBarContainer>
  );
}
