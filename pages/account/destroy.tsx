import { useRouter } from "next/router";
import { destroyCookie } from "nookies";
import { ReactElement } from "react";
import { EmptyObject } from "react-hook-form";
import { APIButton } from "../../components/APIButton";
import SiteLayout from "../../components/SiteLayout";

export default function DestroyAccountPage({}: EmptyObject): ReactElement {
  const { push } = useRouter();
  return (
    <SiteLayout
      content={
        <>
          <h3>Destroy User Account</h3>
          <p>Are you sure you want to destroy your user account and all sites that you own?</p>
          <APIButton
            endpoint="account-destroy"
            payload={{}}
            colorScheme="red"
            onDone={() => {
              destroyCookie(null, "AvenSession");
              push("/login");
            }}
          >
            Destroy Account
          </APIButton>
        </>
      }
    />
  );
}
