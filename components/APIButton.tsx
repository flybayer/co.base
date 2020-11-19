import { Button, Spinner } from "@chakra-ui/core";
import { api } from "../api-utils/api";
import { useState } from "react";
import { PropsOf } from "@emotion/react";

export function APIButton({
  endpoint,
  payload,
  children,
  onDone,
  ...props
}: React.PropsWithChildren<
  {
    endpoint: string;
    payload: any;
    onDone: () => void;
  } & PropsOf<typeof Button>
>) {
  const [isSpin, setIsSpin] = useState(false);
  return (
    <Button
      onClick={() => {
        setIsSpin(true);
        api(endpoint, payload)
          .then(onDone)
          .catch(console.error)
          .finally(() => {
            setIsSpin(false);
          });
      }}
      {...props}
    >
      {children} {isSpin && <Spinner size="sm" />}
    </Button>
  );
}
