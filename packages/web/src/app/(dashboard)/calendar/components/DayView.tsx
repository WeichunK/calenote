/**
 * Day View Component
 *
 * Displays a single day with hourly time slots and entries
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, isSameDay } from 'date-fns';
import type { Entry } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/animations/variants';
import { getEntryTypeIcon } from '@/lib/utils/calendar';

// ==================== TYPES ====================

interface DayViewProps {
  /**
   * The day to display
   */
  day: Date;

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

// Only show working hours (6am - 10pm)
const VISIBLE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

// ==================== HELPER FUNCTIONS ====================

function getEntriesForHour(entries: Entry[], day: Date, hour: number): Entry[] {
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
  const top = (minutes / 60) * 80; // 80px per hour for day view

  // Height based on duration or default to 30 minutes
  let durationMinutes = 30;
  if (entry.end_timestamp) {
    const endDate = parseISO(entry.end_timestamp);
    durationMinutes = (endDate.getTime() - date.getTime()) / (1000 * 60);
  }

  const height = Math.max((durationMinutes / 60) * 80, 30); // Min 30px

  return { top, height };
}

// ==================== COMPONENTS ====================

function TimeSlot({
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
    () => getEntriesForHour(entries, day, hour),
    [entries, day, hour]
  );

  const isCurrentHour = hour === new Date().getHours() && isSameDay(day, new Date());

  return (
    <div
      className={cn(
        'relative border-b min-h-[80px] hover:bg-accent/50 transition-colors cursor-pointer group',
        isCurrentHour && 'bg-primary/5 border-l-4 border-l-primary'
      )}
      onClick={() => onTimeSlotClick?.(day, hour)}
    >
      {/* Plus icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary text-sm">+</span>
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
              'absolute left-0 right-0 mx-2 px-3 py-2 rounded-md text-sm',
              'border-l-4 cursor-pointer hover:shadow-lg transition-all',
              'bg-card',
              entry.is_completed && 'opacity-60'
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
            whileHover={{ scale: 1.01, x: 4, zIndex: 10 }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onEntryClick?.(entry);
            }}
          >
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <div className="flex-1 min-w-0">
                <div className={cn('font-semibold truncate', entry.is_completed && 'line-through')}>
                  {entry.title}
                </div>
                {height > 60 && entry.content && (
                  <div className="text-muted-foreground text-xs mt-1 line-clamp-2">
                    {entry.content}
                  </div>
                )}
                {height > 90 && (entry.tags?.length || 0) > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {entry.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-muted rounded text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {entry.timestamp && (
                <div className="text-[10px] text-muted-foreground">
                  {format(parseISO(entry.timestamp), 'h:mm a')}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export function DayView({
  day,
  entries,
  onTimeSlotClick,
  onEntryClick,
  isLoading,
}: DayViewProps) {
  const isToday = isSameDay(day, new Date());

  // Filter entries for this day
  const dayEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (!entry.timestamp) return false;
        return isSameDay(parseISO(entry.timestamp), day);
      }),
    [entries, day]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading day view...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className={cn('p-4 border-b bg-muted/50', isToday && 'bg-primary/10')}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">
              {format(day, 'EEEE')}
            </div>
            <div className={cn('text-2xl font-semibold', isToday && 'text-primary')}>
              {format(day, 'MMMM d, yyyy')}
            </div>
          </div>
          {dayEntries.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
            </div>
          )}
        </div>
      </div>

      {/* Time slots */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        <div className="grid grid-cols-[100px_1fr]">
          {VISIBLE_HOURS.map((hour) => (
            <div key={hour} className="contents">
              {/* Hour label */}
              <div className="border-r border-b p-3 text-sm font-medium text-muted-foreground text-right bg-muted/30 sticky left-0">
                <div>{format(new Date().setHours(hour, 0), 'h a')}</div>
                <div className="text-xs text-muted-foreground/70">
                  {format(new Date().setHours(hour, 0), 'HH:mm')}
                </div>
              </div>

              {/* Time slot */}
              <TimeSlot
                day={day}
                hour={hour}
                entries={entries}
                onTimeSlotClick={onTimeSlotClick}
                onEntryClick={onEntryClick}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Current time indicator */}
      {isToday && <CurrentTimeIndicator />}

      {/* All-day entries */}
      {dayEntries.some((e) => e.is_all_day) && (
        <div className="border-t p-3 bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            All Day
          </div>
          <div className="space-y-2">
            {dayEntries
              .filter((e) => e.is_all_day)
              .map((entry) => {
                const icon = getEntryTypeIcon(entry.entry_type);
                return (
                  <motion.div
                    key={entry.id}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow',
                      'bg-card',
                      entry.is_completed && 'opacity-60'
                    )}
                    style={{
                      backgroundColor: entry.color ? `${entry.color}20` : undefined,
                      borderLeftColor: entry.color || 'hsl(var(--primary))',
                    }}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => onEntryClick?.(entry)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className={cn('font-medium', entry.is_completed && 'line-through')}>
                        {entry.title}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CURRENT TIME INDICATOR ====================

function CurrentTimeIndicator() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Only show if within visible hours
  if (currentHour < VISIBLE_HOURS[0] || currentHour > VISIBLE_HOURS[VISIBLE_HOURS.length - 1]) {
    return null;
  }

  // Calculate position
  const hoursSinceStart = currentHour - VISIBLE_HOURS[0];
  const top = hoursSinceStart * 80 + (currentMinutes / 60) * 80;

  return (
    <div
      className="absolute left-[100px] right-0 pointer-events-none z-20"
      style={{ top: `${top + 57}px` }} // +57px for header
    >
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg" />
        <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
      </div>
      <div className="text-[10px] text-red-500 font-medium ml-4 mt-0.5">
        {format(now, 'h:mm a')}
      </div>
    </div>
  );
}
