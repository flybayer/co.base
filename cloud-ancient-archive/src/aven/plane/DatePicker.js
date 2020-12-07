import React from 'react';
import Text from './Text';
import { useTheme } from './Theme';
import { TouchableOpacity, View } from '@rn';

const DAY_HEADINGS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function isRealDate(year, month, day) {
  return !Number.isNaN(new Date(`${year} ${month} ${day}`).getTime());
}

function extractYear(whenString) {
  const matchedYear = whenString && whenString.match(/^\d\d\d\d/);
  if (!matchedYear) return null;
  return matchedYear[0];
}
function extractMonth(whenString) {
  const matchedMonth = whenString && whenString.match(/^\d\d\d\d-(\d\d)/);
  if (!matchedMonth) return null;
  return matchedMonth[1];
}

function extractDate(whenString) {
  const matchedDate = whenString && whenString.match(/^\d\d\d\d-\d\d-(\d\d)/);
  if (!matchedDate) return null;
  return matchedDate[1];
}
function getDefaultYear() {
  const y = new Date().getFullYear();
  return String(y);
}
function getDefaultMonth() {
  const m = new Date().getMonth() + 1;
  return String(m).padStart(2, '0');
}

export default function DayPicker({ when, onWhen }) {
  const activeYear = extractYear(when);
  const activeMonth = extractMonth(when);
  const activeDay = extractDate(when);
  const initYear = activeYear || getDefaultYear();
  const initMonth = activeMonth || getDefaultMonth();
  const [viewYear, setViewYear] = React.useState(initYear);
  const [viewMonth, setViewMonth] = React.useState(initMonth);
  const theme = useTheme();
  const weeks = [];
  let dayOfWeekOffset = new Date(`${viewYear} ${viewMonth} 1`).getDay();
  let renderDay = 1;
  const dayCountViewMonth = new Date(viewYear, viewMonth, 0).getDate();
  let viewPrevYear = Number(viewYear);
  let viewPrevMonth = Number(viewMonth) - 1;
  if (viewPrevMonth === 0) {
    viewPrevYear -= 1;
    viewPrevMonth = 12;
  }
  const dayCountPrevViewMonth = new Date(
    viewPrevYear,
    viewPrevMonth,
    0,
  ).getDate();
  while (isRealDate(viewYear, viewMonth, renderDay)) {
    weeks.push(
      <View style={{ flexDirection: 'row' }}>
        {DAY_HEADINGS.map((heading, dayIndex) => {
          let dayNumber = renderDay + dayIndex - dayOfWeekOffset;
          let isThisMonth = true;
          const isActive =
            isThisMonth &&
            Number(viewYear) === Number(activeYear) &&
            Number(viewMonth) === Number(activeMonth) &&
            Number(activeDay) === dayNumber;
          if (dayNumber < 1) {
            isThisMonth = false;
            dayNumber = dayNumber + dayCountPrevViewMonth;
          } else if (dayNumber > dayCountViewMonth) {
            dayNumber -= dayCountViewMonth;
            isThisMonth = false;
          }
          return (
            <TouchableOpacity
              onPress={
                isThisMonth
                  ? () => {
                      onWhen(
                        `${viewYear}-${String(viewMonth).padStart(
                          2,
                          '0',
                        )}-${String(dayNumber).padStart(2, '0')}`,
                      );
                    }
                  : null
              }
              style={{
                width: 54,
                backgroundColor: isActive ? theme.colorPrimary : null,
              }}
            >
              <Text
                theme={{
                  fontSize: 20,
                  colorForeground: isActive
                    ? theme.colorBackground
                    : isThisMonth
                    ? '#222'
                    : '#aaa',
                }}
                center
              >
                {dayNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>,
    );
    renderDay += 7;
  }
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#ccc',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (Number(viewMonth) === 1) {
              setViewYear(viewYear - 1);
              setViewMonth(12);
            } else {
              setViewMonth(viewMonth - 1);
            }
          }}
        >
          <View style={{ width: 40, height: 40 }}>
            <svg width={40} height={40} style={{}}>
              <polygon points="10,20 24,12 24,28" fill={theme.colorPrimary} />
            </svg>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, paddingTop: 10, alignItems: 'center' }}>
          <Text bold theme={{ fontSize: 20 }}>
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (Number(viewMonth) === 12) {
              setViewYear(Number(viewYear) + 1);
              setViewMonth(1);
            } else {
              setViewMonth(Number(viewMonth) + 1);
            }
          }}
        >
          <View style={{ width: 40, height: 40 }}>
            <svg width={40} height={40} style={{}}>
              <polygon points="24,20 10,12 10,28" fill={theme.colorPrimary} />
            </svg>
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {DAY_HEADINGS.map(heading => {
          return (
            <View style={{ width: 54 }}>
              <Text theme={{ fontSize: 24 }} center bold>
                {heading}
              </Text>
            </View>
          );
        })}
      </View>
      {weeks}
    </View>
  );
}
