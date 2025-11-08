// Task Types - 與後端 API schema 對應

import type { Entry } from './entry';

export interface Task {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  due_date?: string; // ISO 8601 format
  status: 'active' | 'completed' | 'archived' | 'cancelled';
  completed_at?: string;
  total_entries: number;
  completed_entries: number;
  completion_percentage: number; // 0-100, auto-calculated by backend
  color?: string;
  icon?: string;
  position: number;
  entries?: Entry[]; // Populated when included
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDTO {
  calendar_id: string;
  title: string;
  description?: string;
  due_date?: string;
  color?: string;
  icon?: string;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: 'active' | 'completed' | 'archived' | 'cancelled';
}

export interface ReorderEntriesDTO {
  entry_ids: string[];
}
