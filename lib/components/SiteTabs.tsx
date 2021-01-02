import { Tab } from "@chakra-ui/core";
import styled from "@emotion/styled";
import Head from "next/head";
import Link from "next/link";
import { PropsWithChildren, ReactElement } from "react";
import { explodeAddress } from "../server/explodeAddress";

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

function TabLink({ children, href }: PropsWithChildren<{ href: string }>): ReactElement {
  return (
    <Link href={href} passHref>
      <Tab as="a">{children}</Tab>
    </Link>
  );
}

export function SiteTabs({
  siteName,
  tab,
  address,
}: {
  siteName: string;
  tab?: "site" | "team" | "history" | "settings" | "data" | "options" | "schema";
  address?: string[];
}): ReactElement {
  // let tabs = (
  //   <Tabs index={["site", "team", "api-tokens", "history", "settings"].findIndex((t) => t === tab)}>
  //     <TabList>
  //       <TabLink href={`/s/${siteName}`}>Site</TabLink>
  //       <TabLink href={`/s/${siteName}/team`}>Team</TabLink>
  //       <TabLink href={`/s/${siteName}/api-tokens`}>API Tokens</TabLink>
  //       <TabLink href={`/s/${siteName}/history`}>History</TabLink>
  //       <TabLink href={`/s/${siteName}/settings`}>Settings</TabLink>
  //     </TabList>
  //   </Tabs>
  // );
  // if (address?.length) {
  //   tabs = (
  //     <Tabs index={["data", "schema", "options"].findIndex((t) => t === tab)}>
  //       <TabList>
  //         <TabLink href={`/s/${siteName}/dashboard/${address.join("/")}`}>Data</TabLink>
  //         <TabLink href={`/s/${siteName}/schema/${address.join("/")}`}>Schema</TabLink>
  //         <TabLink href={`/s/${siteName}/options/${address.join("/")}`}>Options</TabLink>
  //       </TabList>
  //     </Tabs>
  //   );
  // }
  const nodeURL = `/s/${[siteName, ...(address || [])].join("/")}`;
  let tabLink = null;
  const rootLevel = !address?.length;
  if (rootLevel && tab === "history") {
    tabLink = <HeaderLink href={`${nodeURL}/history`} label="/History" />;
  } else if (rootLevel && tab === "settings") {
    tabLink = <HeaderLink href={`${nodeURL}/settings`} label="/Settings" />;
  } else if (rootLevel && tab === "team") {
    tabLink = <HeaderLink href={`${nodeURL}/team`} label="/Team" />;
  } else if (tab === "schema") {
    tabLink = <HeaderLink href={`${nodeURL}/schema`} label="/Schema" />;
  } else if (tab === "history") {
    tabLink = <HeaderLink href={`${nodeURL}/history`} label="/History" />;
  }
  return (
    <TabBarContainer>
      <Head>
        <title>Admin: {siteName}</title>
      </Head>
      <TitleContainer>
        <HeaderLink href={`/s/${siteName}`} label={siteName} />
        {explodeAddress(address).map(({ key, fullAddress }) => (
          <HeaderLink key={fullAddress} href={`/s/${siteName}/dashboard${fullAddress}`} label={`/${key}`} />
        ))}
        {tabLink}
      </TitleContainer>
    </TabBarContainer>
  );
}
