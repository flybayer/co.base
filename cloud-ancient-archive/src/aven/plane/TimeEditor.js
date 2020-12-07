import React from 'react';
import DatePicker from './DatePicker';
import Text from './Text';
import { Spacing } from './Theme';
import { useTheme } from './Theme';
import Button from './Button';
import { opacify } from './utils';
import { View, TouchableOpacity, TextInput } from '@rn';
import useDropdownView from './useDropdownView';

function getHours(hoursValue, isPM) {
  if (Number(hoursValue) === 12) {
    return isPM ? 12 : 0;
  } else if (isPM) {
    return Number(hoursValue) + 12;
  } else {
    return Number(hoursValue);
  }
}
function getHoursArePM(hours) {
  return hours >= 12;
}
function getHourStr(initialHours) {
  if (initialHours === 0) {
    return '12';
  } else if (initialHours > 12) {
    return String(initialHours - 12);
  } else {
    return String(initialHours);
  }
}
export default function TimeEditor({ value, onValue }) {
  const initialDate = React.useMemo(
    () => (value ? new Date(value) : new Date()),
    [],
  );
  console.log({ initialDate });
  const initialHours = initialDate.getHours();
  const initialIsPM = getHoursArePM(initialHours);
  const [hoursValue, setHoursValue] = React.useState(getHourStr(initialHours));
  const [minutesValue, setMinutesValue] = React.useState(
    initialDate && String(initialDate.getMinutes()).padStart(2, '0'),
  );
  const [isPM, setIsPM] = React.useState(initialIsPM);
  React.useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    const correctHours = getHourStr(d.getHours());
    const correctMinutes = String(d.getMinutes()).padStart(2, '0');
    const correctIsPM = getHoursArePM(d.getHours());
    if (correctMinutes !== minutesValue && minutesValue !== '') {
      setMinutesValue(correctMinutes);
    }
    if (correctHours !== hoursValue && hoursValue !== '') {
      setHoursValue(correctHours);
    }
    if (correctIsPM !== isPM) {
      setIsPM(correctIsPM);
    }
  }, [value]);
  function writeHoursValue(v) {
    const d = value ? new Date(value) : new Date();
    d.setHours(v);
    d.setSeconds(0);
    d.setMilliseconds(0);
    console.log('okH', v, d.getTime());
    onValue(d.getTime());
  }
  function writeMinutesValue(v) {
    const d = value ? new Date(value) : new Date();
    d.setMinutes(v);
    d.setSeconds(0);
    d.setMilliseconds(0);
    console.log('ok', v, d.getTime());
    onValue(d.getTime());
  }
  return (
    <View style={{ flexDirection: 'row' }}>
      <TextInput
        value={hoursValue}
        style={{ textAlign: 'right' }}
        onBlur={() => {
          const d = new Date(value);
          const correctHours = getHourStr(d.getHours());
          if (hoursValue !== correctHours) {
            writeHoursValue(correctHours);
          }
        }}
        onChangeText={hoursStr => {
          console.log('heheh', hoursStr);
          if (hoursStr === '') {
            setHoursValue('');
            writeHoursValue(isPM ? 12 : 0);
            return;
          }
          const inputVal = hoursStr.replace(/[^\d.-]/g, '');
          let val = Math.floor(Number(inputVal));
          let isPMval = isPM;
          if (val > 12) {
            val = 12;
          }
          if (val < 1) {
            val = 1;
          }
          const newHoursVal = String(val);
          setHoursValue(newHoursVal);
          writeHoursValue(getHours(newHoursVal, isPMval));
        }}
      />
      <View style={{ justifyContent: 'center' }}>
        <Text style={{}}>:</Text>
      </View>
      <TextInput
        value={minutesValue}
        onBlur={() => {
          const padded = minutesValue.padStart(2, '0');
          if (minutesValue !== padded) {
            setMinutesValue(padded);
          }
        }}
        onChangeText={minutesStr => {
          if (minutesStr === '') {
            setMinutesValue('');
            writeMinutesValue(0);
            return;
          }
          const inputVal = minutesStr.replace(/[^\d.-]/g, '');
          let val = Math.floor(Number(inputVal));
          if (val > 59) {
            val = 59;
          }
          if (val < 0) {
            val = 0;
          }
          if (minutesStr === String(val).padStart(2, '0')) {
            setMinutesValue(minutesStr);
          } else {
            setMinutesValue(String(val));
          }
          writeMinutesValue(val);
        }}
      />
      <Spacing value={4}>
        <Button
          outline
          title={isPM ? 'PM' : 'AM'}
          onPress={() => {
            setIsPM(!isPM);
            writeHoursValue(getHours(hoursValue, !isPM));
          }}
        />
      </Spacing>
    </View>
  );
}
