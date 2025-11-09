// Calendars API
import { apiClient } from './client';
import type { Calendar, CreateCalendarDTO, UpdateCalendarDTO } from '../types/calendar';

interface CalendarListResponse {
  calendars: Calendar[];
  total: number;
}

export const calendarsApi = {
  // 獲取所有 calendars
  getCalendars: () => {
    return apiClient.get<CalendarListResponse>('/calendars');
  },

  // 獲取單個 calendar
  getCalendar: (id: string) => {
    return apiClient.get<Calendar>(`/calendars/${id}`);
  },

  // 創建 calendar
  createCalendar: (data: CreateCalendarDTO) => {
    return apiClient.post<Calendar>('/calendars', data);
  },

  // 更新 calendar
  updateCalendar: (id: string, data: UpdateCalendarDTO) => {
    return apiClient.patch<Calendar>(`/calendars/${id}`, data);
  },

  // 刪除 calendar
  deleteCalendar: (id: string) => {
    return apiClient.delete<void>(`/calendars/${id}`);
  },

  // 設置為默認 calendar
  setDefault: (id: string) => {
    return apiClient.post<Calendar>(`/calendars/${id}/set-default`);
  },
};
