import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';

interface CalendarPickerProps {
  /** Called with ISO date string "YYYY-MM-DD" when a day is selected. */
  onSelectDate: (isoDate: string) => void;
  selectedDate?: string | null;
  /** Range mode: highlight every day between start and end (inclusive). */
  rangeStart?: string | null;
  rangeEnd?: string | null;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function CalendarPicker({
  onSelectDate,
  selectedDate,
  rangeStart,
  rangeEnd,
}: CalendarPickerProps) {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

  const today = startOfDay(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const monthLabel = firstOfMonth
    .toLocaleDateString(undefined, { month: 'long' })
    .toUpperCase();
  const yearLabel = String(viewYear);

  function goToPrevMonth() {
    if (isCurrentMonth) return; // Never navigate before today's month
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  // Build the grid: grayed-out adjacent-month days pad out full weeks
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: { day: number; inMonth: boolean }[] = [
    ...Array.from({ length: leadingBlanks }, (_, i) => ({
      day: daysInPrevMonth - leadingBlanks + 1 + i,
      inMonth: false,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      inMonth: true,
    })),
  ];
  const trailingBlanks = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= trailingBlanks; i++) {
    cells.push({ day: i, inMonth: false });
  }

  return (
    <View style={styles.container}>
      {/* Month header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToPrevMonth}
          disabled={isCurrentMonth}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.navText, isCurrentMonth && styles.navDisabled]}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {monthLabel}
          <Text style={styles.yearLabel}>  {yearLabel}</Text>
        </Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday row */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={`${label}-${i}`} style={styles.weekday}>{label}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          if (!cell.inMonth) {
            return (
              <View key={`adj-${i}`} style={styles.dayCell}>
                <View style={styles.dayCircle}>
                  <Text style={styles.adjacentDayText}>{cell.day}</Text>
                </View>
              </View>
            );
          }
          const cellDate = new Date(viewYear, viewMonth, cell.day);
          const iso = toISODate(cellDate);
          const isPast = cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          const isEndpoint =
            selectedDate === iso || rangeStart === iso || rangeEnd === iso;
          const isInRange =
            !!rangeStart && !!rangeEnd && iso > rangeStart && iso < rangeEnd;

          return (
            <TouchableOpacity
              key={iso}
              style={styles.dayCell}
              disabled={isPast}
              onPress={() => onSelectDate(iso)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.dayCircle,
                  isToday && styles.todayCircle,
                  isInRange && styles.inRangeCircle,
                  isEndpoint && styles.selectedCircle,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isPast && styles.pastDayText,
                    isToday && styles.todayText,
                    isInRange && styles.inRangeDayText,
                    isEndpoint && styles.selectedDayText,
                  ]}
                >
                  {cell.day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const DAY_CIRCLE = 40;

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    ...cardStyle(COLORS),
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.text,
    fontWeight: '700',
  },
  navDisabled: {
    color: COLORS.border,
  },
  monthLabel: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    letterSpacing: 1,
  },
  yearLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: DAY_CIRCLE,
    height: DAY_CIRCLE,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: COLORS.border,
  },
  inRangeCircle: {
    backgroundColor: COLORS.primaryTint,
  },
  selectedCircle: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.body,
    color: COLORS.text,
  },
  todayText: {
    fontFamily: FONTS.heavy,
  },
  pastDayText: {
    color: COLORS.border,
  },
  adjacentDayText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.body,
    color: COLORS.border,
  },
  inRangeDayText: {
    fontFamily: FONTS.heavy,
    color: COLORS.primaryDark,
  },
  selectedDayText: {
    fontFamily: FONTS.heavy,
    color: COLORS.surface,
  },
});
