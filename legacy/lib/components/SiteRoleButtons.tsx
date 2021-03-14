import { useRouter } from "next/router";
import { ReactElement } from "react";
import { APIButton } from "./APIButton";

export function SiteRoleAcceptButton({ siteName, label }: { siteName: string; label?: string }): ReactElement {
  const { push } = useRouter();

  return (
    <APIButton
      colorScheme="avenColor"
      endpoint="site-role-respond"
      payload={{ siteName, accept: true }}
      onDone={() => {
        push(`/s/${siteName}`);
      }}
    >
      {label || <>Join {siteName}</>}
    </APIButton>
  );
}

export function SiteRoleRejectButton({ siteName, label }: { siteName: string; label?: string }): ReactElement {
  const { push } = useRouter();

  return (
    <APIButton
      endpoint="site-role-respond"
      payload={{ siteName, accept: false }}
      onDone={() => {
        push(`/account`);
      }}
    >
      {label || "Reject"}
    </APIButton>
  );
}
