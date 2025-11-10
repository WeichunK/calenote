// Tasks API
import { apiClient } from './client';
import type { Task, CreateTaskDTO, UpdateTaskDTO, ReorderEntriesDTO } from '../types/task';

export interface GetTasksParams {
  calendar_id?: string;
  status?: 'active' | 'completed' | 'archived' | 'cancelled';
  skip?: number;
  limit?: number;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
}

export const tasksApi = {
  // 獲取所有 tasks (returns paginated response)
  getTasks: (params?: GetTasksParams) => {
    return apiClient.get<TasksResponse>('/tasks', params);
  },

  // 獲取單個 task (包含 entries)
  getTask: (id: string) => {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  // 創建 task
  createTask: (data: CreateTaskDTO) => {
    return apiClient.post<Task>('/tasks', data);
  },

  // 更新 task
  updateTask: (id: string, data: UpdateTaskDTO) => {
    return apiClient.patch<Task>(`/tasks/${id}`, data);
  },

  // 刪除 task
  deleteTask: (id: string) => {
    return apiClient.delete<void>(`/tasks/${id}`);
  },

  // 重新排序 entries
  reorderEntries: (taskId: string, data: ReorderEntriesDTO) => {
    return apiClient.post<Task>(`/tasks/${taskId}/reorder`, data);
  },

  // 批量完成 task 中的所有 entries
  completeAllEntries: (taskId: string) => {
    return apiClient.post<Task>(`/tasks/${taskId}/complete-all`);
  },
};
