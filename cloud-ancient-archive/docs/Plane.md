Plane is the UI library for Aven apps.

##

In `src/aven/plane/index.js`, you can see all the modules

```js
export { default as Button } from "./Button";
export { default as ButtonLink } from "./ButtonLink";
export { default as Heading } from "./Heading";
export { default as SmallHeading } from "./SmallHeading";
export { default as Link } from "./Link";
export { default as Tag } from "./Tag";
export { default as TagButton } from "./TagButton";
export { default as MultiSelect } from "./MultiSelect";
export { default as Stack } from "./Stack";
export { default as SmallTag } from "./SmallTag";
export { default as KeyboardPopover } from "./KeyboardPopover";
export { default as Spinner } from "./Spinner";
export { default as SpinnerButton } from "./SpinnerButton";
export { default as AsyncButton } from "./AsyncButton";
export { default as DateTimeInput } from "./DateTimeInput";
export { default as DatePicker } from "./DatePicker";
export { default as TimeEditor } from "./TimeEditor";
export { default as TimeInput } from "./TimeInput";
export { default as Text } from "./Text";
export { default as useDropdownView } from "./useDropdownView";
export { default as useKeyboardPopover } from "./useKeyboardPopover";
export { default as useAsyncErrorPopover } from "./useAsyncErrorPopover";
export { default as TextArea } from "./TextArea";
export { default as TextInput } from "./TextInput";
export { default as Page } from "./Page";
export * from "./Theme";
export * from "./Responsive";
export * from "./utils";
```

## Forms

We want to create forms in a consistent way with minimal boilerplate.

```js
import { useFocus, TextInput } from '@aven/plane';

funcion MyForm({ onSubmit }) {
  const [name, setName]  = React.useState('')
  const [location, setLocation]  = React.useState('')
  async function handleSubmit() {
    await onSubmit({ name, location });
  }
  const inputRenderers = [
    inputProps => (
      <TextInput
        label="field 1"
        mode="name"
        onValue={setName}
        value={name}
        {...inputProps}
      />
    ),
    inputProps => (
      <TextInput
        label="field 2"
        mode="name"
        onValue={setLocation}
        value={location}
        {...inputProps}
      />
    ),
  ];
  const { inputs } = useFocus({
    onSubmit: handleSubmit,
    inputRenderers,
  });
  return <View>
    {inputs}
    <Button title="Submit" onPress={handleSubmit} />
  </View>
}
```
