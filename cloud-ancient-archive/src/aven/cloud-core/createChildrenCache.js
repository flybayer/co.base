export default function createChildrenCache(onCreateChild) {
  const children = new Map();
  function getChild(name) {
    const nameMatch = name.match(/^([^/.]*)/);
    const firstName = nameMatch && nameMatch[0];
    if (!firstName) {
      return null;
    }
    const restOfName =
      name.length > firstName.length ? name.slice(firstName.length + 1) : null;
    if (!nameMatch) {
      return null;
    }
    let childDoc = null;
    if (children.has(firstName)) {
      childDoc = children.get(firstName);
    } else {
      childDoc = onCreateChild(firstName);
      children.set(firstName, childDoc);
    }
    if (restOfName) {
      return childDoc.children.get(restOfName);
    } else {
      return childDoc;
    }
  }
  return {
    get: getChild,
  };
}
