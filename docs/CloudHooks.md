# Cloud Hooks

## useCloud

The same as `React.useContext(CloudContext)`

Used to get the current cloud client for you component

## useCloudValue

```js
import { useCloud, useStream, useCloudValue } from "@cloud-core";

function MyData() {
  const cloud = useCloud();
  const doc = cloud.get("Data");
  const currentValue = useStream(doc.value);

  // there is a shortcut to do this!
  const currentValue = useCloudValue("Data");
}
```

## useCloudState

You may be familiar with React.useState. This is meant to be similar.

```js
function MyToggle() {
  const [isOn, setIsOn] = useCloudState('IsOn', false);

  return <Button title={isOn ? 'Turn off' : 'Turn on'} onPress={() -> {
    setIsOn(!isOn);
  }} />
}

```

## useStream
