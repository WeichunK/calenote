'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search entries..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          className="max-w-md"
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

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Entry Type Filter */}
        <Select
          value={filters.entryType}
          onValueChange={(value: string) =>
            updateFilter('entryType', value as FilterSortState['entryType'])
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="event">📅 Event</SelectItem>
            <SelectItem value="reminder">⏰ Reminder</SelectItem>
            <SelectItem value="note">📝 Note</SelectItem>
          </SelectContent>
        </Select>

        {/* Scheduled Filter */}
        <Select
          value={filters.hasTimestamp}
          onValueChange={(value: string) =>
            updateFilter('hasTimestamp', value as FilterSortState['hasTimestamp'])
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Schedule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="scheduled">🗓️ Scheduled</SelectItem>
            <SelectItem value="unscheduled">📌 Unscheduled</SelectItem>
          </SelectContent>
        </Select>

        {/* Completion Filter */}
        <Select
          value={filters.isCompleted}
          onValueChange={(value: string) =>
            updateFilter('isCompleted', value as FilterSortState['isCompleted'])
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">⭕ Active</SelectItem>
            <SelectItem value="completed">✅ Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={filters.sortBy}
          onValueChange={(value: string) =>
            updateFilter('sortBy', value as FilterSortState['sortBy'])
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Created Date</SelectItem>
            <SelectItem value="timestamp">Scheduled Time</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Select
          value={filters.sortOrder}
          onValueChange={(value: string) =>
            updateFilter('sortOrder', value as FilterSortState['sortOrder'])
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">↑ Ascending</SelectItem>
            <SelectItem value="desc">↓ Descending</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
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
    </div>
  );
}
