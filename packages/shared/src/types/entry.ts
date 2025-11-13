// Entry Types - 與後端 API schema 對應

import type { UserSummary } from './auth';

export interface Entry {
  id: string;
  calendar_id: string;
  title: string;
  content?: string;
  entry_type: 'note' | 'task' | 'event'; // Must match backend validation
  timestamp?: string; // ISO 8601 format
  end_timestamp?: string;
  is_all_day?: boolean;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  priority?: 0 | 1 | 2 | 3; // 0=none, 1=low, 2=medium, 3=high
  tags?: string[];
  color?: string;
  reminder_time?: string;
  recurrence_rule?: string;
  task_id?: string;
  task?: Task; // Populated when included
  created_by: string;
  created_by_user?: UserSummary; // Creator information for collaboration
  created_at: string;
  updated_at: string;
  last_modified_by?: string;
  last_modified_by_user?: UserSummary; // Modifier information
}

export interface CreateEntryDTO {
  calendar_id: string;
  title: string;
  content?: string;
  entry_type?: 'note' | 'task' | 'event'; // Must match backend validation
  timestamp?: string;
  end_timestamp?: string;
  is_all_day?: boolean;
  priority?: 0 | 1 | 2 | 3;
  tags?: string[];
  color?: string;
  reminder_time?: string;
  recurrence_rule?: string;
  task_id?: string;
}

export interface UpdateEntryDTO {
  // Only fields that can be updated (excludes calendar_id, is_completed)
  title?: string;
  content?: string;
  entry_type?: 'note' | 'task' | 'event'; // Must match backend validation
  timestamp?: string;
  end_timestamp?: string;
  is_all_day?: boolean;
  priority?: 0 | 1 | 2 | 3;
  tags?: string[];
  color?: string;
  reminder_time?: string;
  recurrence_rule?: string;
  position_in_task?: number;
}

// For frontend use
export type PriorityLabel = 'none' | 'low' | 'medium' | 'high';

export function getPriorityLabel(priority?: 0 | 1 | 2 | 3): PriorityLabel {
  switch (priority) {
    case 1: return 'low';
    case 2: return 'medium';
    case 3: return 'high';
    default: return 'none';
  }
}

export function getPriorityValue(label: PriorityLabel): 0 | 1 | 2 | 3 {
  switch (label) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 0;
  }
}

// Import Task type (avoid circular dependency)
import type { Task } from './task';
