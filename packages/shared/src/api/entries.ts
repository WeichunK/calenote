// Entries API
import { apiClient } from './client';
import type { Entry, CreateEntryDTO, UpdateEntryDTO } from '../types/entry';

export interface GetEntriesParams {
  calendar_id?: string;
  has_timestamp?: boolean;
  start_date?: string;
  end_date?: string;
  entry_type?: string;
  is_completed?: boolean;
  task_id?: string;
  skip?: number;
  limit?: number;
}

export const entriesApi = {
  // 獲取所有 entries
  getEntries: (params?: GetEntriesParams) => {
    // Ensure params is undefined if calendar_id is missing (required by backend)
    if (!params || !params.calendar_id) {
      throw new Error('calendar_id is required to fetch entries');
    }
    return apiClient.get<Entry[]>('/entries', params);
  },

  // 獲取單個 entry
  getEntry: (id: string) => {
    return apiClient.get<Entry>(`/entries/${id}`);
  },

  // 創建 entry
  createEntry: (data: CreateEntryDTO) => {
    return apiClient.post<Entry>('/entries', data);
  },

  // 更新 entry
  updateEntry: (id: string, data: UpdateEntryDTO) => {
    return apiClient.patch<Entry>(`/entries/${id}`, data);
  },

  // 刪除 entry
  deleteEntry: (id: string) => {
    return apiClient.delete<void>(`/entries/${id}`);
  },

  // 切換完成狀態
  toggleComplete: (id: string, isCompleted: boolean) => {
    return apiClient.post<Entry>(`/entries/${id}/complete`, {
      is_completed: isCompleted,
    });
  },

  // 添加到 task
  addToTask: (id: string, taskId: string) => {
    return apiClient.post<Entry>(`/entries/${id}/add-to-task`, {
      task_id: taskId,
    });
  },

  // 從 task 移除
  removeFromTask: (id: string) => {
    return apiClient.post<Entry>(`/entries/${id}/remove-from-task`);
  },

  // 批量更新
  batchUpdate: (ids: string[], updates: Partial<Entry>) => {
    return apiClient.post<Entry[]>('/entries/batch-update', {
      ids,
      updates,
    });
  },

  // 批量刪除
  batchDelete: (ids: string[]) => {
    return apiClient.post<void>('/entries/batch-delete', { ids });
  },
};
