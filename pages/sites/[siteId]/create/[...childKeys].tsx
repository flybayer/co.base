import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../../api-utils/getVerifedUser";
import ControlledInput from "../../../../components/ControlledInput";
import DashboardBreadcrumbs from "../../../../components/DashboardBreadcrumbs";
import NodeDashboard from "../../../../components/NodeDashboard";
import SiteLayout from "../../../../components/SiteLayout";
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
  const site = await database.site.findOne({ where: { name: siteName } });
  const siteQuery = { name: siteName };
  const whereQ = childKeys.reduce<any>(
    (last: ManyQuery, childKey: string, childKeyIndex: number): ManyQuery => {
      return { site: siteQuery, parentNode: last, key: childKey };
    },
    null
  ) as ManyQuery;
  if (whereQ === null) throw new Error("Unexpectd nullfail");
  let nodes = await database.siteNode.findMany({
    where: whereQ,
    include: { SiteNode: { select: { id: true, key: true } } },
  });
  const node = nodes[0];
  const children = node.SiteNode;
  return {
    props: {
      user: verifiedUser,
      siteName,
      address: childKeys,
      node: {
        children,
      },
    },
  };
};

function CreateNodeForm({
  address,
  siteName,
}: {
  address: string[];
  siteName: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { push } = useRouter();
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("node-create", {
            address,
            siteName,
            name: data.name,
          })
            .then(() => {
              push(
                `/sites/${siteName}/dashboard/${[...address, data.name].join(
                  "/"
                )}`
              );
            })
            .catch((e) => {
              console.error(e);
              alert("failed");
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        })}
      >
        <FormControl>
          <FormLabel htmlFor="name-input">Public Slug</FormLabel>
          <ControlledInput
            id="name-input"
            placeholder="mysite"
            name="name"
            control={control}
          />
        </FormControl>
        <Button type="submit">Create</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export default function CreateChildPage({
  siteName,
  address,
  node,
}: {
  siteName: string;
  address: string[];
  node: {
    children: Array<{
      key: string;
    }>;
  };
}) {
  return (
    <SiteLayout
      content={
        <>
          <DashboardBreadcrumbs
            siteName={siteName}
            address={address}
            nodeFeature="Create"
          />

          <h3>Create New Node under {address.join("/")}</h3>
          <CreateNodeForm siteName={siteName} address={address} />
        </>
      }
    />
  );
}
