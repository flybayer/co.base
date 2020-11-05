import { Input } from "@chakra-ui/core";
import { Controller, Control } from "react-hook-form";

export default function ControlledInput({
  control,
  name,
}: { control: Control; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ onChange, onBlur, value, name }) => (
        <Input
          value={value}
          name={name}
          onBlur={onBlur}
          onChange={(e: any) => {
            onChange(e.nativeEvent.target.value);
          }}
        />
      )}
    />
  );
}
