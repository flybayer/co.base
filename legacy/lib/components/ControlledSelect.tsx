import { Select } from "@chakra-ui/core";
import { ReactElement } from "react";
import { Control, Controller } from "react-hook-form";

export function ControlledSelect({
  options,
  control,
  name,
  id,
}: {
  name: string;
  id: string;
  control: Control;
  options: Array<{ key: string; name: string }>;
}): ReactElement {
  return (
    <Controller
      name={name}
      control={control}
      render={({ value, onChange }) => (
        <Select
          value={value}
          id={id}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        >
          {options.map(({ key, name }) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </Select>
      )}
    />
  );
}
