import React from 'react';

export function Responsive({
  style = {},
  children,
  breakpoint,
  className,
  theme: themeProp,
  ...rest
}) {
  const newStyles = Object.keys(style).reduce((acc, s) => {
    acc[s] = style[s][0];
    return acc;
  }, {});
  // {React.Children.map(children, child =>
  //   React.cloneElement(child, {
  //     style: newStyles,
  //     ...rest,
  //   }),
  // )}
  return <React.Fragment>{children}</React.Fragment>;
}
