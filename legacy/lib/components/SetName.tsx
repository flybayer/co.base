import { ReactElement, useState } from "react";
import { Button, FormControl, FormLabel, Text, useDisclosure } from "@chakra-ui/core";
import ControlledInput from "../../lib/components/ControlledInput";
import { api } from "../../lib/server/api";
import { GenericModal, ModalForm } from "../../lib/components/Modal";
import { useFullForm } from "../../lib/components/Form";

function ModalChangeNameForm({
  name,
  onComplete,
}: {
  name: string;
  onComplete: (response: void, data: { name: string }) => void;
}) {
  const { isSubmitting, errors, control, error, submitHandler } = useFullForm({
    defaultValues: { name },
    onSubmit: (data) =>
      api("account-set-profile", {
        name: data.name,
      }),
    onComplete,
  });
  return (
    <ModalForm isSubmitting={isSubmitting} submitHandler={submitHandler} submitLabel="Set Account Name" error={error}>
      <FormControl isRequired>
        <FormLabel htmlFor="name-input">Display Name</FormLabel>
        <ControlledInput name="name" placeholder="jane-doe" id="name-input" control={control} />
        {errors.name && <p>{errors.name.message}</p>}
      </FormControl>
    </ModalForm>
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
    <GenericModal isOpen={isOpen} onClose={onComplete} title="Set Public Display Name">
      <ModalChangeNameForm
        name={initialName || ""}
        onComplete={(_, { name }) => {
          onComplete(name);
        }}
      />
    </GenericModal>
  );
}

export function SetNameButton({ user }: { user: { name: string | null } }): ReactElement {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [localName, setLocalName] = useState(user.name);
  return (
    <>
      <Text>Public Name: {localName}</Text>
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
