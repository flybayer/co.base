import { Text } from "@chakra-ui/core";
import { ReactElement } from "react";

export function ErrorText({ children }: React.PropsWithChildren<unknown>): ReactElement {
  return <Text color="red.700">{children}</Text>;
}
