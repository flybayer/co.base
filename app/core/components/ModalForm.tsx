import { useDisclosure } from "@chakra-ui/hooks"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal"
import { PropsWithChildren, ReactElement, ReactNode } from "react"
import { UseFormOptions } from "react-hook-form"
import * as z from "zod"
import { Button } from "./Button"
import Form, { FORM_ERROR } from "./Form"

export function GenericModal({
  isOpen,
  onClose,
  children,
  title,
  footer,
}: PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  title?: string
  footer?: ReactNode
}>): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </Modal>
  )
}

export function ButtonModalForm<FormSchema extends z.ZodType<any, any>, SubmitResponse>({
  children,
  title,
  schema,
  handleSubmit,
  submitText,
  buttonText,
  initialValues,
  onComplete,
}: PropsWithChildren<{
  title: string
  schema: FormSchema
  handleSubmit: (values: z.infer<FormSchema>) => Promise<SubmitResponse>
  submitText: string
  buttonText: string
  initialValues: UseFormOptions<z.infer<FormSchema>>["defaultValues"]
  onComplete?: (values: z.infer<FormSchema>, response: SubmitResponse) => void
}>) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button onClick={onOpen}>{buttonText}</Button>
      <GenericModal title={title} isOpen={isOpen} onClose={onClose}>
        <Form
          submitText={submitText}
          schema={schema}
          initialValues={initialValues}
          onSubmit={async (values: z.infer<FormSchema>) => {
            try {
              const resp = await handleSubmit(values)
              onComplete?.(values, resp)
              onClose()
            } catch (error) {
              if (error.name === "ResetPasswordError") {
                return {
                  [FORM_ERROR]: error.message,
                }
              } else {
                return {
                  [FORM_ERROR]: "Sorry, we had an unexpected error. Please try again.",
                }
              }
            }
          }}
        >
          {children}
        </Form>
      </GenericModal>
    </>
  )
}
