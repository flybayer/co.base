import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { SiteTabs } from "../../../components/SiteTabs";
import { database } from "../../../data/database";
import {
  Button,
  Divider,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/core";
import { ButtonContainer, ListContainer, ListItem } from "../../../components/List";
import ControlledInput from "../../../components/ControlledInput";
import { ControlledSelect } from "../../../components/ControlledSelect";
import { api } from "../../../api-utils/api";
import { handleAsync } from "../../../data/handleAsync";
import { useForm } from "react-hook-form";
import { TokenCreateResponse } from "../../../data/SiteEvent";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  const siteName = String(context.params?.siteId);
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const site = await database.site.findUnique({ where: { name: siteName } });
  if (!site) return { redirect: { destination: "/account", permanent: false } };
  const tokens = await database.siteToken.findMany({
    where: { site: { name: siteName } },
    select: { label: true, type: true, id: true },
  });
  return {
    props: {
      user: verifiedUser,
      tokens,
      siteName,
    },
  };
};
function NewTokenForm({
  siteName,
  onNewToken,
}: {
  siteName: string;
  onNewToken: (t: { token: string; label: string; type: string }) => void;
}): ReactElement {
  const { handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      label: "",
      type: "read",
    },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        handleAsync(
          api<TokenCreateResponse>("site-token-create", { siteName, ...data }),
          ({ token }) => {
            onNewToken({ token, ...data });
          },
        );
      })}
    >
      <FormControl>
        <FormLabel htmlFor="label-input">Name</FormLabel>
        <ControlledInput control={control} name="label" id="label-input" />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="type-select">Token Permission</FormLabel>
        <ControlledSelect
          options={[
            { key: "read", name: "Read" },
            { key: "write", name: "Write" },
          ]}
          control={control}
          name="type"
          id="type-select"
        />
      </FormControl>
      <Button colorScheme="avenColor" type="submit">
        Create
      </Button>
    </form>
  );
}
function NewTokenDisplay({ label, token, type }: { label: string; token: string; type: string }): ReactElement {
  return (
    <div>
      &quot;{label}&quot; - {type} API Token
      <p>{token}</p>
    </div>
  );
}
function AddTokenButton({ siteName }: { siteName: string }): ReactElement {
  const [newToken, setToken] = useState<{ label: string; token: string; type: string } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button colorScheme="avenColor" onClick={onOpen}>
        New Token
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <ModalHeader>New API Token</ModalHeader>
            <ModalCloseButton />
            {newToken ? <NewTokenDisplay {...newToken} /> : <NewTokenForm siteName={siteName} onNewToken={setToken} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

type Tokens = Array<{ label: string; id: number; type: string }>;

function APITokens({ siteName, tokens }: { siteName: string; tokens: Tokens }): ReactElement {
  return (
    <ListContainer>
      {tokens.map((token) => (
        <ListItem key={token.id}>
          {token.label} - {token.type}{" "}
          <Button
            colorScheme="red"
            onClick={() => {
              handleAsync(api("site-token-destroy", { tokenId: token.id, siteName }));
            }}
          >
            Delete
          </Button>
        </ListItem>
      ))}
      <Divider />
      <ButtonContainer>
        <AddTokenButton siteName={siteName} />
      </ButtonContainer>
    </ListContainer>
  );
}

export default function APITokensPage({
  user,
  siteName,
  tokens,
}: {
  user: APIUser;
  siteName: string;
  tokens: Tokens;
}): ReactElement {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <SiteTabs tab="api-tokens" siteName={siteName} />
          <APITokens tokens={tokens} siteName={siteName} />
        </>
      }
    />
  );
}
