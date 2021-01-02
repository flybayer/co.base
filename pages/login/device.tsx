import { BasicSiteLayout, SmallFormPage } from "../../lib/components/SiteLayout";
import { GetServerSideProps } from "next";
import React, { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { authRedirect } from "../../lib/server/authRedirect";
import { handleAsync } from "../../lib/data/handleAsync";
import { api } from "../../lib/server/api";
import { useRouter } from "next/router";
import { Control, DeepPartial, UnpackNestedValue, useForm } from "react-hook-form";
import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import ControlledInput from "../../lib/components/ControlledInput";
import { database } from "../../lib/data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getVerifiedUser(context.req, context.res);
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

function SmallForm<FormData>({
  defaultValues,
  onSubmit,
  onComplete,
  render,
}: {
  defaultValues: UnpackNestedValue<DeepPartial<FormData>>;
  onSubmit: (data: UnpackNestedValue<FormData>) => Promise<void>;
  onComplete: () => void;
  render: (args: { control: Control<FormData> }) => ReactElement;
}): ReactElement {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<null | string>(null);
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues,
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        setIsSubmitting(true);
        handleAsync(onSubmit(data), onComplete).finally(() => setIsSubmitting(false));
      })}
    >
      {render({ control })}
      {errorText && <p style={{ color: "#a66" }}>{errorText}</p>}
      <Button type="submit">Add Device</Button>
      {isSubmitting && <Spinner size="sm" />}
    </form>
  );
}

function NewDeviceForm({
  user,
  defaultName,
  token,
}: {
  user?: APIUser;
  defaultName?: string;
  token: string;
}): ReactElement {
  const { push } = useRouter();
  return (
    <SmallForm
      defaultValues={{
        name: defaultName,
      }}
      onSubmit={(data) =>
        api("device-approve", {
          token,
          name: data.name,
        })
      }
      onComplete={() => {
        push("/account/devices");
      }}
      render={({ control }) => (
        <>
          <FormControl>
            <FormLabel htmlFor="name-input">Device Name</FormLabel>
            <ControlledInput name="name" placeholder="" id="name-input" control={control} />
          </FormControl>
        </>
      )}
    />
  );
}

//   const [isSubmitting, setIsSubmitting] = React.useState(false);
//   const [errorText, setErrorText] = React.useState<null | string>(null);
//   const { register, handleSubmit, errors, control } = useForm({
//     mode: "onBlur",
//     defaultValues: {
//       name: defaultName,
//     },
//   });
//   return (
//     <>
//       <form
//         onSubmit={handleSubmit((data) => {
//           setIsSubmitting(true);
//           handleAsync(
//             api("device-approve", {
//               token,
//               name: data.name,
//             }),
//             () => {
//               push("/account");
//             },
//           ).finally(() => setIsSubmitting(false));
//         })}
//       >
//         <FormControl>
//           <FormLabel htmlFor="name-input">Device Name</FormLabel>
//           <ControlledInput name="name" placeholder="" id="name-input" control={control} />
//         </FormControl>
//         {errorText && <p style={{ color: "#a66" }}>{errorText}</p>}
//         <Button type="submit">Add Device</Button>
//         {isSubmitting && <Spinner size="sm" />}
//       </form>
//     </>
//   );
// }

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
      content={
        <SmallFormPage>
          <NewDeviceForm user={user} defaultName={defaultName} token={token} />
        </SmallFormPage>
      }
    />
  );
}
