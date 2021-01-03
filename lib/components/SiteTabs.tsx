import { ReactElement } from "react";
import { NodeType } from "../../packages/client/dist/lib/data/NodeSchema";
import { explodeAddress } from "../server/explodeAddress";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { HeaderLink, TitleContainer } from "../components/Header";

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
  } else if (tab === "options") {
    tabLink = <HeaderLink href={`/s/${siteName}/options/${address?.join("/")}`} label="/options" icon="cog" />;
  } else if (tab === "history") {
    tabLink = <HeaderLink href={`/s/${siteName}/history/${address?.join("/")}`} label="/history" icon="history" />;
  }
  return (
    <TitleContainer>
      <HeaderLink
        href={`/s/${siteName}`}
        label={siteName}
        icon={address?.length || tab !== "site" ? undefined : "cubes"}
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
              icon={icon as IconName}
            />
          );
        }
        return <HeaderLink key={fullAddress} href={`/s/${siteName}/dashboard${fullAddress}`} label={`/${key}`} />;
      })}
      {tabLink}
    </TitleContainer>
  );
}
