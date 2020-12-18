import { Button } from "@chakra-ui/core";
import Head from "next/head";
import { ReactElement } from "react";
import { APIUser } from "../api-utils/getVerifedUser";

export function PaddleSetup(): ReactElement {
  console.log("LAOALASLD");
  return (
    <Head>
      <script
        src="https://cdn.paddle.com/paddle/paddle.js"
        onLoad={() => {
          // (global as any).Paddle.Setup({ vendor: 123776 });
          console.log("laoded?1");
        }}
      />
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{ __html: "console.log('setuo attempt'); Paddle.Setup({ vendor: 123776 });" }}
      />
    </Head>
  );
}

export function DevPreviewSubscribeButton({ label, user }: { label?: string; user: APIUser }): ReactElement {
  return (
    <Button
      colorScheme="avenColor"
      onClick={() => {
        (global as any).Paddle.Checkout.open({
          product: 637971,
          email: user.email,
          quantity: 1,
          allowQuantity: false,
        });
      }}
    >
      {label || "Join the Developer Preview"}
    </Button>
  );
}
