import { ReactElement } from "react";
import { Button, FormControl, FormLabel, useDisclosure } from "@chakra-ui/core";
import ControlledInput from "../../lib/components/ControlledInput";
import { api } from "../../lib/server/api";
import { GenericModal, ModalForm } from "../../lib/components/Modal";
import { useFullForm } from "../../lib/components/Form";

function ModalAddEmailForm({ onComplete }: { onComplete: (response: void, data: { email: string }) => void }) {
  const { isSubmitting, errors, control, error, submitHandler } = useFullForm({
    defaultValues: { email: "" },
    onSubmit: (data) =>
      api("account-add-email", {
        email: data.email,
      }),
    onComplete,
  });
  return (
    <ModalForm isSubmitting={isSubmitting} submitHandler={submitHandler} submitLabel="Add Email" error={error}>
      <FormControl isRequired>
        <FormLabel htmlFor="email-input">Email Address</FormLabel>
        <ControlledInput name="email" placeholder="jane.doe@email.com" id="email-input" control={control} />
        {errors.email && <p>{errors.email.message}</p>}
      </FormControl>
    </ModalForm>
  );
}

function AddEmailModal({ isOpen, onComplete }: { isOpen: boolean; onComplete: (email?: string) => void }) {
  return (
    <GenericModal isOpen={isOpen} onClose={onComplete} title="Add Email to Account">
      <ModalAddEmailForm
        onComplete={(_, { email }) => {
          onComplete(email);
        }}
      />
    </GenericModal>
  );
}

export function AddEmailButton({ onNewEmail }: { onNewEmail: (email: string) => void }): ReactElement {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onClick={onOpen} variant="outline">
        Add Email
      </Button>
      <AddEmailModal
        isOpen={isOpen}
        onComplete={(email) => {
          email && onNewEmail(email);
          onClose();
        }}
      />
    </>
  );
}
