import React from 'react';
import { useTheme } from './Theme';
import { View } from '@aven/views';
import CSSProperties from './CSSProperties';

function validateNumberValue(value) {
  if (typeof value === 'number') {
    return `${value}px`;
  } else {
    return value;
  }
}

function useComponentID() {
  return React.useMemo(() => {
    return `r-${Math.random()
      .toString(36)
      .substring(2, 5)}${Math.random()
      .toString(36)
      .substring(2, 5)}`;
  }, []);
}

export function Responsive({
  style = {},
  children,
  breakpoints,
  className,
  theme: themeProp,
  ...rest
}) {
  /*
    - create component id
    - iterate over breakpoints
      - iterate over styles
    
    - return children map with new className
  */
  const theme = useTheme(themeProp);
  const viewports = breakpoints || theme.breakpoints;
  const compID = useComponentID();

  function mapStyles(styleIndex = 0) {
    return Object.keys(style)
      .map(attr => {
        if (!CSSProperties[attr]) {
          console.warn('Invalid responsive Style property', attr);
          return `${attr}: ${validateNumberValue(style[attr][styleIndex])};`;
        }

        if (Array.isArray(CSSProperties[attr])) {
          // check for special attributes (marginVertical, paddingVertical...)
          return CSSProperties[attr]
            .map(k => `${k}: ${validateNumberValue(style[attr][styleIndex])};`)
            .join('');
        }
        return `${CSSProperties[attr]}: ${validateNumberValue(
          style[attr][styleIndex],
        )};`;
      })
      .join('');
  }

  const styleString = viewports
    .map((bp, idx) => {
      // if it's not the first breakpoint, don't add the `@media` in front
      return idx > 0
        ? `@media(min-width: ${viewports[idx - 1]}px){.${compID}{${mapStyles(
            idx,
          )}}}`
        : `.${compID}{${mapStyles(idx)}}`;
    })
    .join('');
  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          /* eslint-disable-line */
          __html: styleString,
        }}
      />
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          className: `${compID}${className ? ` ${className}` : ''}`,
          ...rest,
        }),
      )}
    </React.Fragment>
  );
}

export function ColumnToRow({
  children,
  columnReverse = false,
  rowReverse = false,
  style = {},
  breakpoints,
  resetFlexBasis,
  ...rest
}) {
  const elemID = useComponentID();
  const theme = useTheme();
  const bp = breakpoints || theme.breakpoints;
  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
      .vertical-to-horizontal-layout-${elemID} {
        display: flex;
        flex-direction: ${columnReverse ? 'column-reverse' : 'column'};
      }

      .vertical-to-horizontal-layout-${elemID} > .vertical-to-horizontal-layout__child {
        margin-left: 0;
        margin-right: 0;
      }

      @media only screen and (min-width: ${bp[0]}px) {
        .vertical-to-horizontal-layout-${elemID} {
          flex-direction: ${rowReverse ? 'row-reverse' : 'row'};
        }

        ${
          !resetFlexBasis
            ? `.vertical-to-horizontal-layout-${elemID} > .vertical-to-horizontal-layout__child {
          flex: 1;
          flex-basis: 0;
        }`
            : ''
        }
      }
      `,
        }}
      />
      <View
        className={`vertical-to-horizontal-layout-${elemID}`}
        style={style}
        {...rest}
      >
        {children}
      </View>
    </React.Fragment>
  );
}

export function ColumnToRowChild({
  className,
  inverted = false,
  style,
  ...rest
}) {
  return (
    // TODO: RESPONSIVE: add/remove margin for responsive
    <View
      className={`vertical-to-horizontal-layout__child ${className}`}
      style={style}
      {...rest}
    />
  );
}

export function NoFlexToFlex({ children, breakpoints }) {
  const theme = useTheme();
  const bp = breakpoints || theme.breakpoints;
  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
      .no-flex-to-flex,
      .no-flex-to-flex > * {
        flex: none;
      }

      @media only screen and (min-width: ${bp[0]}px) {
        .no-flex-to-flex,
        .no-flex-to-flex > * {
          flex: 1;
        }
      }
    `,
        }}
      />
      <View className="no-flex-to-flex">{children}</View>
    </React.Fragment>
  );
}

export function ResponsiveDisplay({ breakpoints }) {
  const theme = useTheme();
  const bp = breakpoints || theme.breakpoints;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `

        .hide-mobile {
          display: none;
        }

        .hide-desktop {
          display: flex;
        }

        @media only screen and (min-width: ${bp[0]}px) {
          .hide-desktop {
            display: none;
          }

          .hide-mobile {
            display: flex;
          }
        }
      `,
      }}
    />
  );
}

export function HideDesktopView({ className, ...rest }) {
  return <View className={`hide-desktop ${className}`} {...rest} />;
}

export function HideMobileView({ className, ...rest }) {
  return <View className={`hide-mobile ${className}`} {...rest} />;
}
