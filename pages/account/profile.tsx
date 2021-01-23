import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { ReactElement, useState } from "react";
import { AccountPage } from "../../lib/components/AccountPage";
import { MainSection } from "../../lib/components/CommonViews";
import {
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/core";
import ControlledInput from "../../lib/components/ControlledInput";
import { api } from "../../lib/server/api";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return {
    props: {
      user: verifiedUser,
    },
  };
};

function ChangeUsernameForm({ username, onComplete }: { username: string; onComplete: (username: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSubmit, errors, control, clearErrors } = useForm({
    mode: "onBlur",
    defaultValues: {
      username,
    },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        setIsSubmitting(true);
        clearErrors();
        api("account-set-username", {
          username: data.username,
        })
          .then(() => {
            onComplete(data.username);
          })
          .catch((e) => {
            setError(e.message);
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      })}
    >
      <ModalBody>
        <FormControl isRequired>
          <FormLabel htmlFor="username-input">Login username</FormLabel>
          <ControlledInput name="username" placeholder="jane-doe" id="username-input" control={control} />
          {errors.username && <p>{errors.username.message}</p>}
        </FormControl>
        {error && <Text color="red.700">{error}</Text>}
      </ModalBody>
      <ModalFooter>
        {isSubmitting && <Spinner size="sm" />}
        <Button type="submit">Set Username</Button>
      </ModalFooter>
    </form>
  );
}

function SetUsernameButton({ user }: { user: { username: string } }): ReactElement {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [localName, setLocalName] = useState(user.username);
  const { reload } = useRouter();
  return (
    <>
      <Text>Username: {localName}</Text>
      <Button onClick={onOpen} variant="outline">
        Set Username
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set Username</ModalHeader>
          <ChangeUsernameForm
            username={user.username}
            onComplete={(username) => {
              setLocalName(username);
              onClose();
              reload();
            }}
          />
        </ModalContent>
      </Modal>
    </>
  );
}

function ChangeNameForm({ name, onComplete }: { name: string; onComplete: (name: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const { handleSubmit, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name,
    },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        setIsSubmitting(true);
        api("account-set-profile", {
          name: data.name,
        })
          .then(() => {
            onComplete(data.name);
          })
          .catch((e) => {
            setError(e.message);
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      })}
    >
      <ModalBody>
        <FormControl>
          <FormLabel htmlFor="name-input">Your Display Name</FormLabel>
          <ControlledInput name="name" placeholder="Jane Doe" id="name-input" control={control} />
        </FormControl>
        {error && <Text color="red.700">{error}</Text>}
        {isSubmitting && <Spinner size="sm" />}
      </ModalBody>
      <ModalFooter>
        <Button type="submit">Set Name</Button>
      </ModalFooter>
    </form>
  );
}

function ChangeNameModal({
  isOpen,
  onComplete,
  initialName,
}: {
  isOpen: boolean;
  onComplete: (name?: string) => void;
  initialName: null | string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onComplete}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Set Public Display Name</ModalHeader>
        <ChangeNameForm name={initialName || ""} onComplete={onComplete} />
      </ModalContent>
    </Modal>
  );
}

function SetNameButton({ user }: { user: { name: string | null } }): ReactElement {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [localName, setLocalName] = useState(user.name);
  return (
    <>
      <Text>Your Public Name: {localName}</Text>
      <Button onClick={onOpen} variant="outline">
        Set Name
      </Button>
      <ChangeNameModal
        isOpen={isOpen}
        initialName={localName}
        onComplete={(name) => {
          name && setLocalName(name);
          onClose();
        }}
      />
    </>
  );
}

export default function AccountProfilePage({ user }: { user: APIUser }): ReactElement {
  return (
    <AccountPage tab="profile" user={user}>
      <MainSection title="Profile">
        <SetNameButton user={user} />
        <SetUsernameButton user={user} />
      </MainSection>
    </AccountPage>
  );
}
