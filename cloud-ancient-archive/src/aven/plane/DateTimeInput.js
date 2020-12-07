import React from 'react';
import DatePicker from './DatePicker';
import Text from './Text';
import { useTheme } from './Theme';
import { opacify } from './utils';
import { View, TouchableOpacity } from '@rn';
import useDropdownView from './useDropdownView';
import TimeEditor from './TimeEditor';

export default function DateTimeInput({ theme: themeProp, value, onValue }) {
  const displayValue = React.useMemo(() => value || Date.now(), [value]);
  const displayDate = new Date(displayValue);
  const theme = useTheme(themeProp);
  const when = `${displayDate.getFullYear()}-${String(
    displayDate.getMonth() + 1,
  ).padStart(2, '0')}-${String(displayDate.getDate()).padStart(2, '0')}`;
  const { onPopover, targetRef } = useDropdownView(({ onClose }) => (
    <View style={{}}>
      <DatePicker
        when={when}
        onWhen={when => {
          onClose();
          const time = value || Date.now();
          const d = new Date(time);
          const yearStr = when.match(/^(\d\d\d\d)/)[1];
          const monthStr = when.match(/-(\d\d)-/)[1];
          const dateStr = when.match(/-(\d\d)$/)[1];
          d.setFullYear(Number(yearStr));
          d.setMonth(Number(monthStr) - 1);
          d.setDate(Number(dateStr));
          const output = d.getTime();
          onValue(output);
        }}
      />
    </View>
  ));
  return (
    <View
      style={{
        borderWidth: 3,
        borderRadius: 4,
        borderColor: opacify(theme.colorPrimary, 0.6),
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <TouchableOpacity
        style={{
          alignSelf: 'stretch',
        }}
        onPress={onPopover}
      >
        <View style={{ flex: 1, width: 380 }} ref={targetRef}>
          <Text>{when}</Text>
        </View>
      </TouchableOpacity>
      <TimeEditor value={displayValue} onValue={onValue} />
    </View>
  );
}
