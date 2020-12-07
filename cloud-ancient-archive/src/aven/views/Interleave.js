import React from 'react';

export default function Interleave({ renderDivider, items }) {
  const outputItems = [];
  items.forEach((item, index) => {
    outputItems.push(item);
    const isLastItem = index === items.length - 1;
    if (!isLastItem) {
      outputItems.push(renderDivider({ key: `divider-${index}` }));
    }
  });
  return <React.Fragment>{outputItems}</React.Fragment>;
}
