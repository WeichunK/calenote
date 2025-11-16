import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, calendarsApi } from '@calenote/shared';
import type { LoginRequest, RegisterRequest } from '@calenote/shared';
import { useAuthStore } from '@/lib/stores/authStore';
import { useCalendarStore } from '@/lib/stores/calendarStore';

export function useLogin() {
  const { login: storeLogin } = useAuthStore();
  const { setCurrentCalendar } = useCalendarStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response) => {
      // 1. Store user and tokens first
      storeLogin(
        response.user,
        response.access_token,
        response.refresh_token
      );

      // 2. Fetch user's calendars and set the default calendar
      try {
        const calendarsData = await calendarsApi.getCalendars();

        if (calendarsData.calendars && calendarsData.calendars.length > 0) {
          // Find default calendar or use first one
          const defaultCalendar = calendarsData.calendars.find((cal) => cal.is_default);
          const calendarToSelect = defaultCalendar || calendarsData.calendars[0];

          // Set current calendar in store
          setCurrentCalendar(calendarToSelect.id);

          // Populate React Query cache so useCalendars doesn't refetch
          queryClient.setQueryData(['calendars', 'list'], calendarsData);
        }
      } catch (error) {
        console.error('Failed to fetch calendars after login:', error);
        // Don't fail login if calendar fetch fails
      }
    },
  });
}

export function useRegister() {
  const { login: storeLogin } = useAuthStore();
  const { setCurrentCalendar } = useCalendarStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async (response) => {
      // 1. Store user and tokens first
      storeLogin(
        response.user,
        response.access_token,
        response.refresh_token
      );

      // 2. Fetch user's calendars and set the default calendar
      try {
        const calendarsData = await calendarsApi.getCalendars();

        if (calendarsData.calendars && calendarsData.calendars.length > 0) {
          // Find default calendar or use first one
          const defaultCalendar = calendarsData.calendars.find((cal) => cal.is_default);
          const calendarToSelect = defaultCalendar || calendarsData.calendars[0];

          // Set current calendar in store
          setCurrentCalendar(calendarToSelect.id);

          // Populate React Query cache so useCalendars doesn't refetch
          queryClient.setQueryData(['calendars', 'list'], calendarsData);
        }
      } catch (error) {
        console.error('Failed to fetch calendars after registration:', error);
        // Don't fail registration if calendar fetch fails
      }
    },
  });
}
