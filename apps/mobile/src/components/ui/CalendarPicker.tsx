import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

interface CalendarPickerProps {
  /** Called with ISO date string "YYYY-MM-DD" when a day is selected. */
  onSelectDate: (isoDate: string) => void;
  selectedDate?: string | null;
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

export function CalendarPicker({ onSelectDate, selectedDate }: CalendarPickerProps) {
  const today = startOfDay(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const monthLabel = firstOfMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

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

  // Build the grid: blanks + day numbers
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

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
          <Text style={[styles.navText, isCurrentMonth && styles.navDisabled]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navText}>›</Text>
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
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`blank-${i}`} style={styles.dayCell} />;
          }
          const cellDate = new Date(viewYear, viewMonth, day);
          const iso = toISODate(cellDate);
          const isPast = cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          const isSelected = selectedDate === iso;

          return (
            <TouchableOpacity
              key={iso}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                isSelected && styles.selectedCell,
              ]}
              disabled={isPast}
              onPress={() => onSelectDate(iso)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.dayText,
                  isPast && styles.pastDayText,
                  isSelected && styles.selectedDayText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.primary,
    fontWeight: '700',
  },
  navDisabled: {
    color: COLORS.border,
  },
  monthLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  pastDayText: {
    color: COLORS.border,
  },
  selectedDayText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
});
