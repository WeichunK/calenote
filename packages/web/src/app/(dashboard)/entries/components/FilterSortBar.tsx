'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal } from 'lucide-react';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

export interface FilterSortState {
  entryType: 'all' | 'event' | 'note' | 'reminder';
  hasTimestamp: 'all' | 'scheduled' | 'unscheduled';
  isCompleted: 'all' | 'completed' | 'active';
  sortBy: 'created' | 'timestamp' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

interface FilterSortBarProps {
  filters: FilterSortState;
  onFiltersChange: (filters: FilterSortState) => void;
}

export function FilterSortBar({ filters, onFiltersChange }: FilterSortBarProps) {
  const isMobile = useIsMobile();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const updateFilter = <K extends keyof FilterSortState>(
    key: K,
    value: FilterSortState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.entryType !== 'all' ||
    filters.hasTimestamp !== 'all' ||
    filters.isCompleted !== 'all' ||
    filters.searchQuery !== '';

  const clearFilters = () => {
    onFiltersChange({
      entryType: 'all',
      hasTimestamp: 'all',
      isCompleted: 'all',
      sortBy: 'created',
      sortOrder: 'desc',
      searchQuery: '',
    });
  };

  // Get active filter labels for mobile chips
  const getActiveFilterLabels = () => {
    const labels: Array<{ key: string; label: string; value: string }> = [];
    if (filters.entryType !== 'all') {
      const typeLabels = { event: '📅 Event', reminder: '⏰ Reminder', note: '📝 Note' };
      labels.push({ key: 'entryType', label: typeLabels[filters.entryType], value: 'all' });
    }
    if (filters.hasTimestamp !== 'all') {
      const scheduleLabels = { scheduled: '🗓️ Scheduled', unscheduled: '📌 Unscheduled' };
      labels.push({ key: 'hasTimestamp', label: scheduleLabels[filters.hasTimestamp], value: 'all' });
    }
    if (filters.isCompleted !== 'all') {
      const statusLabels = { active: '⭕ Active', completed: '✅ Completed' };
      labels.push({ key: 'isCompleted', label: statusLabels[filters.isCompleted], value: 'all' });
    }
    return labels;
  };

  // Filter controls component (shared between mobile/desktop)
  const FilterControls = () => (
    <>
      {/* Entry Type Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium md:hidden">Type</label>
        <Select
          value={filters.entryType}
          onValueChange={(value: string) =>
            updateFilter('entryType', value as FilterSortState['entryType'])
          }
        >
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="event">📅 Event</SelectItem>
            <SelectItem value="reminder">⏰ Reminder</SelectItem>
            <SelectItem value="note">📝 Note</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scheduled Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium md:hidden">Schedule</label>
        <Select
          value={filters.hasTimestamp}
          onValueChange={(value: string) =>
            updateFilter('hasTimestamp', value as FilterSortState['hasTimestamp'])
          }
        >
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Schedule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="scheduled">🗓️ Scheduled</SelectItem>
            <SelectItem value="unscheduled">📌 Unscheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Completion Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium md:hidden">Status</label>
        <Select
          value={filters.isCompleted}
          onValueChange={(value: string) =>
            updateFilter('isCompleted', value as FilterSortState['isCompleted'])
          }
        >
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">⭕ Active</SelectItem>
            <SelectItem value="completed">✅ Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="text-sm font-medium md:hidden">Sort By</label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: string) =>
            updateFilter('sortBy', value as FilterSortState['sortBy'])
          }
        >
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Created Date</SelectItem>
            <SelectItem value="timestamp">Scheduled Time</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <label className="text-sm font-medium md:hidden">Order</label>
        <Select
          value={filters.sortOrder}
          onValueChange={(value: string) =>
            updateFilter('sortOrder', value as FilterSortState['sortOrder'])
          }
        >
          <SelectTrigger className="w-full md:w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">↑ Ascending</SelectItem>
            <SelectItem value="desc">↓ Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search entries..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => updateFilter('searchQuery', '')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile: Filter button */}
        {isMobile && (
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters & Sort</SheetTitle>
                <SheetDescription>
                  Customize how entries are filtered and sorted
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <FilterControls />
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearFilters();
                      setIsFilterSheetOpen(false);
                    }}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Mobile: Active filter chips */}
      {isMobile && hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {getActiveFilterLabels().map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {filter.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter(filter.key as keyof FilterSortState, filter.value as any)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.searchQuery && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Search: {filters.searchQuery.substring(0, 20)}
              {filters.searchQuery.length > 20 && '...'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter('searchQuery', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Desktop: Full filter row */}
      {!isMobile && (
        <div className="flex flex-wrap gap-3 items-center">
          <FilterControls />
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
