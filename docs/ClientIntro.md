# Create a client

You need to have a data source already.

```js
const source = createFSStorageSource(...); // for example
const client = createCloudClient({
  domain: 'my.domain',
  source,
});
```

Now you have access to a client, in a domain of data.

## List the docs

```js
const allDocs = cloud.docs.all;

const currentAllList = await allDocs.load();

// now currentAllList is a object where keys are names and values are docs
```

## Get the value of a doc

```js
const doc = cloud.docs.get("DocName");

const docValue = await doc.value.load();

// now docValue is the current value.
```

## Value of a doc within a component

```js
import { useCloud, useStream, useCloudValue } from '@aven/cloud-core';

function MyData() {
  const cloud = useCloud();
  const doc = cloud.get('Data');
  const currentValue = useStream(doc.value);

  // there is a shortcut to do this!
  const currentValue = useCloudValue('Data');
}

```

## Children and Grandchildren Docs

```js
const people = cloud.docs.get("People");

const jose = people.children.get("Jose");
// same as:
// const jose = cloud.docs.get('People/Jose');
```

## Lists and destroying

```js
const people = cloud.docs.get("People");

const allPeople = await people.children.all.load();

await people.children.get("Eric").destory();

const peopleWithoutEric = await people.children.all.load();
```

## Component that lists all

```js
function PeopleList() {
  const cloud = useCloud();
  // same as:
  // const cloud = React.useContext(CloudContext);

  const peopleList = cloud.docs.get("People").children.all;
  const currentPeople = useStream(peopleList);

  return Object.entries(currentPeople).map((userName, personDoc) => (
    <Person name={userName} />
  ));
}

<PeopleList />;
```
