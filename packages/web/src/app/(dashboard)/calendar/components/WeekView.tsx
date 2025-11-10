/**
 * Week View Component
 *
 * Displays a week calendar with time slots and entries
 */

'use client';

import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import type { Entry } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/animations/variants';
import { getEntryTypeIcon } from '@/lib/utils/calendar';

// ==================== TYPES ====================

interface WeekViewProps {
  /**
   * The week to display (any date in that week)
   */
  week: Date;

  /**
   * Entries to display
   */
  entries: Entry[];

  /**
   * Callback when a time slot is clicked
   */
  onTimeSlotClick?: (date: Date, hour: number) => void;

  /**
   * Callback when an entry is clicked
   */
  onEntryClick?: (entry: Entry) => void;

  /**
   * Loading state
   */
  isLoading?: boolean;
}

// ==================== CONSTANTS ====================

// Time slots from 0-23 hours
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Only show working hours by default (6am - 10pm)
const VISIBLE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22 (6am - 10pm)

// ==================== HELPER FUNCTIONS ====================

function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function getEntriesForDayAndHour(
  entries: Entry[],
  day: Date,
  hour: number
): Entry[] {
  return entries.filter((entry) => {
    if (!entry.timestamp) return false;

    const entryDate = parseISO(entry.timestamp);
    const entryHour = entryDate.getHours();

    return isSameDay(entryDate, day) && entryHour === hour;
  });
}

function getEntryPosition(entry: Entry): { top: number; height: number } {
  if (!entry.timestamp) return { top: 0, height: 60 };

  const date = parseISO(entry.timestamp);
  const minutes = date.getMinutes();

  // Calculate position within the hour (0-60 minutes)
  const top = (minutes / 60) * 60; // 60px per hour

  // Height based on duration or default to 30 minutes
  let durationMinutes = 30;
  if (entry.end_timestamp) {
    const endDate = parseISO(entry.end_timestamp);
    durationMinutes = (endDate.getTime() - date.getTime()) / (1000 * 60);
  }

  const height = Math.max((durationMinutes / 60) * 60, 20); // Min 20px

  return { top, height };
}

// ==================== COMPONENTS ====================

const TimeSlot = memo(function TimeSlot({
  day,
  hour,
  entries,
  onTimeSlotClick,
  onEntryClick,
}: {
  day: Date;
  hour: number;
  entries: Entry[];
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onEntryClick?: (entry: Entry) => void;
}) {
  const hourEntries = useMemo(
    () => getEntriesForDayAndHour(entries, day, hour),
    [entries, day, hour]
  );

  return (
    <div
      className={cn(
        'relative border-b border-r min-h-[60px] hover:bg-accent/50 transition-colors cursor-pointer group',
        hour === new Date().getHours() && isSameDay(day, new Date()) && 'bg-primary/5'
      )}
      onClick={() => onTimeSlotClick?.(day, hour)}
    >
      {/* Plus icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary text-xs">+</span>
        </div>
      </div>

      {/* Entries */}
      {hourEntries.map((entry) => {
        const { top, height } = getEntryPosition(entry);
        const icon = getEntryTypeIcon(entry.entry_type);

        return (
          <motion.div
            key={entry.id}
            className={cn(
              'absolute left-0 right-0 mx-1 px-2 py-1 rounded text-xs overflow-hidden',
              'border-l-2 cursor-pointer hover:shadow-md transition-shadow',
              'bg-card',
              entry.is_completed && 'opacity-60 line-through'
            )}
            style={{
              top: `${top}px`,
              height: `${height}px`,
              backgroundColor: entry.color ? `${entry.color}20` : undefined,
              borderLeftColor: entry.color || 'hsl(var(--primary))',
            }}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.02, zIndex: 10 }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onEntryClick?.(entry);
            }}
          >
            <div className="font-medium truncate">
              {icon} {entry.title}
            </div>
            {height > 40 && entry.content && (
              <div className="text-muted-foreground text-[10px] truncate mt-0.5">
                {entry.content}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
});

// ==================== MAIN COMPONENT ====================

export function WeekView({
  week,
  entries,
  onTimeSlotClick,
  onEntryClick,
  isLoading,
}: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(week), [week]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading week view...</div>
      </div>
    );
  }

  return (
    <div className="border-l border-t overflow-x-auto">
      {/* Header with day names */}
      <div className="sticky top-0 z-10 bg-background grid grid-cols-[80px_repeat(7,minmax(120px,1fr))]">
        <div className="border-r border-b p-2 text-sm font-medium bg-muted">
          Time
        </div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'border-r border-b p-2 text-center',
                'bg-muted',
                isToday && 'bg-primary/10 font-semibold'
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg',
                  isToday && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots grid */}
      <div className="grid grid-cols-[80px_repeat(7,minmax(120px,1fr))]">
        {VISIBLE_HOURS.map((hour) => (
          <div key={hour} className="contents">
            {/* Hour label */}
            <div className="border-r border-b p-2 text-xs text-muted-foreground text-right bg-muted/50">
              {format(new Date().setHours(hour, 0), 'ha')}
            </div>

            {/* Time slots for each day */}
            {weekDays.map((day) => (
              <TimeSlot
                key={`${day.toISOString()}-${hour}`}
                day={day}
                hour={hour}
                entries={entries}
                onTimeSlotClick={onTimeSlotClick}
                onEntryClick={onEntryClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      <CurrentTimeIndicator weekDays={weekDays} />
    </div>
  );
}

// ==================== CURRENT TIME INDICATOR ====================

const CurrentTimeIndicator = memo(function CurrentTimeIndicator({ weekDays }: { weekDays: Date[] }) {
  const now = new Date();
  const currentDayIndex = weekDays.findIndex((day) => isSameDay(day, now));

  if (currentDayIndex === -1) return null;

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Only show if within visible hours
  if (currentHour < VISIBLE_HOURS[0] || currentHour > VISIBLE_HOURS[VISIBLE_HOURS.length - 1]) {
    return null;
  }

  // Calculate position
  const hoursSinceStart = currentHour - VISIBLE_HOURS[0];
  const top = hoursSinceStart * 60 + (currentMinutes / 60) * 60;
  const left = 80 + (currentDayIndex * (100 / 7)); // 80px for time column + day column

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-20"
      style={{ top: `${top + 48}px` }} // +48px for header
    >
      <div
        className="absolute flex items-center"
        style={{ left: `${left}%`, width: `${100/7}%` }}
      >
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
});
