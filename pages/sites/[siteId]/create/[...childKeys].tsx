import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import ControlledInput from "../../../../components/ControlledInput";
import { CreateNodeForm } from "../../../../components/CreateForm";

import SiteLayout, { BasicSiteLayout } from "../../../../components/SiteLayout";
import { SiteTabs } from "../../../../components/SiteTabs";
import { database } from "../../../../data/database";

type ManyQuery = null | {
  parentNode: ManyQuery;
  key: string;
  site: { name: string };
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = String(context.params?.siteId);
  const childKeys = String(context.params?.childKeys || "").split(",");
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: verifiedUser,
      siteName,
      address: childKeys,
    },
  };
};

export default function CreateChildPage({
  user,
  siteName,
  address,
}: {
  user: APIUser;
  siteName: string;
  address: string[];
}): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <SiteTabs tab="data" siteName={siteName} address={address} />

          <CreateNodeForm siteName={siteName} address={address} />
        </>
      }
    />
  );
}
