import React from 'react';
import { View } from '@rn';
import { Spacing, useTheme } from './Theme';

// TODO: stack is consufsing with navigation, we need a better name (Box?, Set?, Group?)
export default function Stack({
  children,
  horizontal = false,
  inline = false,
  debug = false,
  stretch = false,
  stretchInside = false,
  // TODO: what is the most common, inline or block?? what is the best name?
  theme: themeProp,
}) {
  const theme = useTheme(themeProp);
  return (
    <View
      style={[
        {
          flexDirection: horizontal ? 'row' : 'column',
          flexWrap: 'wrap',
          alignItems: stretchInside ? 'stretch' : 'flex-start',
          width: '100%',
          flex: stretch ? 1 : null,
        },
        debug && { backgroundColor: 'lightblue' },
        // horizontal && { height: '100%' },
      ]}
    >
      {/* TODO: WTF is happening here? if I render twice the `item` it renders properly but this does not :( */}
      {React.Children.map(children, (item, index) => {
        if (!item) {
          return null;
        }
        return (
          <Spacing key={index} inline={inline} theme={theme}>
            {item}
          </Spacing>
        );
      })}
    </View>
  );
}
