import { destroyCookie } from "nookies";
import { useRouter } from "next/router";
import { Button } from "@chakra-ui/core";
import { ReactElement } from "react";
import { Icon } from "./Icon";
import { RightIconContainer } from "./Buttons";

export function LogOutButton(): ReactElement {
  const { push } = useRouter();
  return (
    <Button
      onClick={() => {
        destroyCookie(null, "AvenSession");
        setTimeout(() => {
          push("/preview");
        }, 10);
      }}
    >
      Log Out
      <RightIconContainer>
        <Icon icon="sign-out" />
      </RightIconContainer>
    </Button>
  );
}
