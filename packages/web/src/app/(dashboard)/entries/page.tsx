'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEntries } from '@/lib/hooks/useEntries';
import { useCalendars } from '@/lib/hooks/useCalendars';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import type { Entry } from '@calenote/shared';
import { FilterSortBar, type FilterSortState } from './components/FilterSortBar';
import { EntriesList } from './components/EntriesList';
import { EntryDialog } from '../calendar/components/EntryDialog';

export default function EntriesPage() {
  const { currentCalendar } = useCalendars();

  // Connect to WebSocket for real-time updates
  useWebSocket({
    calendarId: currentCalendar?.id || '',
    enabled: !!currentCalendar?.id,
  });

  // Filters and sort state
  const [filters, setFilters] = useState<FilterSortState>({
    entryType: 'all',
    hasTimestamp: 'all',
    isCompleted: 'all',
    sortBy: 'created',
    sortOrder: 'desc',
    searchQuery: '',
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | undefined>();

  // Fetch all entries for current calendar
  const { data: allEntries, isLoading, error } = useEntries(
    currentCalendar ? { calendar_id: currentCalendar.id } : undefined
  );

  // Client-side filtering and sorting
  const filteredAndSortedEntries = useMemo(() => {
    if (!allEntries) return [];

    let filtered = [...allEntries];

    // Apply entry type filter
    if (filters.entryType !== 'all') {
      filtered = filtered.filter(entry => entry.entry_type === filters.entryType);
    }

    // Apply timestamp filter
    if (filters.hasTimestamp === 'scheduled') {
      filtered = filtered.filter(entry => entry.timestamp !== null && entry.timestamp !== undefined);
    } else if (filters.hasTimestamp === 'unscheduled') {
      filtered = filtered.filter(entry => !entry.timestamp);
    }

    // Apply completion filter
    if (filters.isCompleted === 'completed') {
      filtered = filtered.filter(entry => entry.is_completed);
    } else if (filters.isCompleted === 'active') {
      filtered = filtered.filter(entry => !entry.is_completed);
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        entry.content?.toLowerCase().includes(query) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'timestamp':
          if (!a.timestamp && !b.timestamp) comparison = 0;
          else if (!a.timestamp) comparison = 1;
          else if (!b.timestamp) comparison = -1;
          else comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'priority':
          comparison = (b.priority || 0) - (a.priority || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allEntries, filters]);

  const handleEntryClick = (entry: Entry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedEntry(undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEntry(undefined);
  };

  if (!currentCalendar) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-muted-foreground">
            Manage all your entries ({filteredAndSortedEntries.length}{' '}
            {filters.searchQuery || filters.entryType !== 'all' ||
            filters.hasTimestamp !== 'all' || filters.isCompleted !== 'all'
              ? `of ${allEntries?.length || 0}`
              : ''})
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Filter and Sort Bar */}
      <FilterSortBar filters={filters} onFiltersChange={setFilters} />

      {/* Entries List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Loading entries...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          <p>Failed to load entries. Please try again.</p>
        </div>
      ) : (
        <EntriesList
          entries={filteredAndSortedEntries}
          onEntryClick={handleEntryClick}
          groupBy={filters.hasTimestamp === 'all' ? 'date' : 'none'}
        />
      )}

      {/* Entry Dialog */}
      {currentCalendar && (
        <EntryDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          entry={selectedEntry}
          calendarId={currentCalendar.id}
        />
      )}
    </div>
  );
}
