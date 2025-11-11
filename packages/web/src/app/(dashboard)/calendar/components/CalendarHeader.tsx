import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarClock } from 'lucide-react';
import type { Task } from '@calenote/shared';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMonthYear } from '@/lib/utils/calendar';
import { TaskFilter } from './TaskFilter';

export type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  viewType?: CalendarViewType;
  onViewTypeChange?: (viewType: CalendarViewType) => void;
  tasks?: Task[];
  unassignedCount?: number;
  selectedTaskIds?: Set<string>;
  onTaskFilterChange?: (taskIds: Set<string>) => void;
}

export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  viewType = 'month',
  onViewTypeChange,
  tasks = [],
  unassignedCount = 0,
  selectedTaskIds = new Set(),
  onTaskFilterChange,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 p-4 border-b">
      {/* Top row: Navigation and View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous {viewType}</span>
          </Button>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next {viewType}</span>
          </Button>
          <h2 className="text-xl font-semibold ml-2">{formatMonthYear(currentMonth)}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          {onViewTypeChange && (
            <Tabs value={viewType} onValueChange={(v: string) => onViewTypeChange(v as CalendarViewType)}>
              <TabsList>
                <TabsTrigger value="month" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Month</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Week</span>
                </TabsTrigger>
                <TabsTrigger value="day" className="gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <span className="hidden sm:inline">Day</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Task Filter */}
          {onTaskFilterChange && (tasks.length > 0 || unassignedCount > 0) && (
            <TaskFilter
              tasks={tasks}
              selectedTaskIds={selectedTaskIds}
              unassignedCount={unassignedCount}
              onSelectionChange={onTaskFilterChange}
            />
          )}

          <Button variant="outline" onClick={onToday}>
            Today
          </Button>
        </div>
      </div>
    </div>
  );
}
