import { ReactElement, useState } from "react";
import { Button, FormControl, FormLabel, Text, useDisclosure } from "@chakra-ui/core";
import ControlledInput from "../../lib/components/ControlledInput";
import { api } from "../../lib/server/api";
import { useRouter } from "next/router";
import { isRootUser } from "../../lib/server/root";
import { GenericModal, ModalForm } from "../../lib/components/Modal";
import { useFullForm } from "../../lib/components/Form";

function ModalChangeUsernameForm({
  username,
  onComplete,
}: {
  username: string;
  onComplete: (response: void, data: { username: string }) => void;
}) {
  const { isSubmitting, errors, control, error, submitHandler } = useFullForm({
    defaultValues: { username },
    onSubmit: (data) =>
      api("account-set-username", {
        username: data.username,
      }),
    onComplete,
  });
  return (
    <ModalForm isSubmitting={isSubmitting} submitHandler={submitHandler} submitLabel="Set Username" error={error}>
      <FormControl isRequired>
        <FormLabel htmlFor="username-input">Username</FormLabel>
        <ControlledInput name="username" placeholder="jane-doe" id="username-input" control={control} />
        {errors.username && <p>{errors.username.message}</p>}
      </FormControl>
    </ModalForm>
  );
}

function ChangeUsernameModal({
  isOpen,
  onComplete,
  username,
}: {
  isOpen: boolean;
  onComplete: (s?: string) => void;
  username: string;
}) {
  return (
    <GenericModal isOpen={isOpen} onClose={onComplete} title="Set Username">
      {isRootUser({ username }) ? (
        <Text margin={6} color="red.600">
          You are the root user! If anyone else takes your CURRENT username, they will become the root user! Please, do
          not do this!
        </Text>
      ) : (
        <Text margin={6}>Note: Any external links to your previous username will be broken! Proceed with caution.</Text>
      )}
      <ModalChangeUsernameForm
        username={username}
        onComplete={(_, { username }) => {
          onComplete(username);
        }}
      />
    </GenericModal>
  );
}

export function SetUsernameButton({ user }: { user: { username: string } }): ReactElement {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [localName, setLocalName] = useState(user.username);
  const { reload } = useRouter();
  return (
    <>
      <Text>Username: {localName}</Text>
      <Button onClick={onOpen} variant="outline">
        Set Username
      </Button>
      <ChangeUsernameModal
        isOpen={isOpen}
        username={localName}
        onComplete={(username) => {
          onClose();
          if (username) {
            setLocalName(username);
            reload();
          }
        }}
      />
    </>
  );
}
