import { BasicSiteLayout } from "../../components/SiteLayout";
import { GetServerSideProps } from "next";
import React, { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import { authRedirect } from "../../api-utils/authRedirect";
import { handleAsync } from "../../data/handleAsync";
import { api } from "../../api-utils/api";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import ControlledInput from "../../components/ControlledInput";
import { database } from "../../data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getVerifiedUser(context.req);
  if (!user) return authRedirect(context);
  const token = context.query.t && String(context.query.t);
  if (!token) return { redirect: { destination: "/account", permanent: false } };
  const deviceToken = await database.deviceToken.findUnique({ where: { token } });
  if (!deviceToken) return { redirect: { destination: "/account", permanent: false } };
  return {
    props: {
      user,
      defaultName: context.query.name || null,
      token,
    },
  };
};

function NewDeviceForm({
  user,
  defaultName,
  token,
}: {
  user?: APIUser;
  defaultName?: string;
  token: string;
}): ReactElement {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<null | string>(null);
  const { push } = useRouter();
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: defaultName,
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          handleAsync(
            api("device-approve", {
              token,
              name: data.name,
            }),
            () => {
              push("/account");
            },
          ).finally(() => setIsSubmitting(false));
        })}
      >
        <FormControl>
          <FormLabel htmlFor="name-input">Device Name</FormLabel>
          <ControlledInput name="name" placeholder="" id="name-input" control={control} />
        </FormControl>
        {errorText && <p style={{ color: "#a66" }}>{errorText}</p>}
        <Button type="submit">Add Device</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function LoginPage({
  user,
  defaultName,
  token,
}: {
  user?: APIUser;
  defaultName?: string;
  token: string;
}): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      title="Register Device"
      content={<NewDeviceForm user={user} defaultName={defaultName} token={token} />}
    />
  );
}
