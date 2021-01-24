import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
} from "@chakra-ui/core";
import { PropsWithChildren, ReactElement } from "react";
import { ErrorText } from "./Error";
import { Visibility } from "./Visibility";

export function GenericModal({
  isOpen,
  onClose,
  children,
  title,
}: PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}>): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        {children}
      </ModalContent>
    </Modal>
  );
}

export function ModalForm({
  submitHandler,
  isSubmitting,
  submitLabel = "Submit",
  error,
  children,
}: PropsWithChildren<{
  submitHandler: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  error?: string | null;
}>): ReactElement {
  return (
    <form onSubmit={submitHandler}>
      <ModalBody>
        {children}
        {error && <ErrorText>{error}</ErrorText>}
      </ModalBody>
      <ModalFooter justifyContent="space-between">
        <Visibility visible={isSubmitting}>
          <Spinner size="md" />
        </Visibility>
        <Button type="submit">{submitLabel}</Button>
      </ModalFooter>
    </form>
  );
}
