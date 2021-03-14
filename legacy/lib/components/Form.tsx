import { useState } from "react";
import { Control, DeepMap, FieldError, UnpackNestedValue, useForm } from "react-hook-form";

export function useFullForm<FormValues, ResponseValue = void>({
  defaultValues,
  onSubmit,
  onComplete,
}: {
  defaultValues: FormValues;
  onSubmit: (data: FormValues) => Promise<ResponseValue>;
  onComplete: (response: ResponseValue, data: FormValues) => void;
}): {
  isSubmitting: boolean;
  errors: DeepMap<any, FieldError>;
  error?: null | string;
  control: Control;
  submitHandler: () => void;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSubmit, errors, control, clearErrors } = useForm({
    mode: "onBlur",
    defaultValues: defaultValues as any, // TODO HALP FIX TYPES
  });
  const submitHandler = handleSubmit((data: UnpackNestedValue<FormValues>) => {
    setIsSubmitting(true);
    clearErrors();
    setError(null);
    onSubmit(data as FormValues) // TODO HALP FIX TYPES
      .then((response) => {
        onComplete(response, data as FormValues); // TODO HALP FIX TYPES
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  });
  return { isSubmitting, errors, error, control, submitHandler };
}
