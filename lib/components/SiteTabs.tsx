import styled from "@emotion/styled";
import Head from "next/head";
import Link from "next/link";
import { ReactElement } from "react";
import { NodeType } from "../../packages/client/dist/lib/data/NodeSchema";
import { explodeAddress } from "../server/explodeAddress";
import { Icon } from "./Icon";
import { IconName } from "@fortawesome/fontawesome-svg-core";

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
  line-height: 52px;
`;
function HeaderLink({ href, label, icon }: { href: string; label: string; icon?: IconName }) {
  return (
    <Link href={href} passHref>
      <HeaderA>
        {label}
        {icon && (
          <div style={{ marginLeft: 12, position: "relative", top: 3, display: "inline-block" }}>
            <Icon icon={icon} size="1x" />
          </div>
        )}
      </HeaderA>
    </Link>
  );
}

export function SiteTabs({
  siteName,
  tab,
  address,
  nodeType,
}: {
  siteName: string;
  tab?: "site" | "team" | "history" | "settings" | "data" | "options" | "schema";
  address?: string[];
  nodeType?: NodeType;
}): ReactElement {
  const nodeURL = `/s/${[siteName, ...(address || [])].join("/")}`;
  let tabLink = null;
  const rootLevel = !address?.length;
  if (rootLevel && tab === "history") {
    tabLink = <HeaderLink href={`${nodeURL}/history`} label="/history" icon="history" />;
  } else if (rootLevel && tab === "settings") {
    tabLink = <HeaderLink href={`${nodeURL}/settings`} label="/settings" icon="cog" />;
  } else if (rootLevel && tab === "team") {
    tabLink = <HeaderLink href={`${nodeURL}/team`} label="/team" icon="users" />;
  } else if (tab === "schema") {
    tabLink = <HeaderLink href={`/s/${siteName}/schema/${address?.join("/")}`} label="/schema" icon="pencil-ruler" />;
  } else if (tab === "history") {
    tabLink = <HeaderLink href={`/s/${siteName}/history/${address?.join("/")}`} label="/history" icon="history" />;
  }
  return (
    <TabBarContainer>
      <Head>
        <title>Admin: {siteName}</title>
      </Head>
      <TitleContainer>
        <HeaderLink
          href={`/s/${siteName}`}
          label={siteName}
          icon={address?.length || tab !== "site" ? null : "cubes"}
        />
        {explodeAddress(address).map(({ key, fullAddress }, index) => {
          if (index + 1 === address?.length) {
            let icon = undefined;
            if (nodeType === "folder") icon = "folder";
            else if (nodeType === "record") icon = "sticky-note";
            else if (nodeType === "record-set") icon = "layer-group";
            return (
              <HeaderLink
                key={fullAddress}
                href={`/s/${siteName}/dashboard${fullAddress}`}
                label={`/${key}`}
                icon={icon}
              />
            );
          }
          return <HeaderLink key={fullAddress} href={`/s/${siteName}/dashboard${fullAddress}`} label={`/${key}`} />;
        })}
        {tabLink}
      </TitleContainer>
    </TabBarContainer>
  );
}
