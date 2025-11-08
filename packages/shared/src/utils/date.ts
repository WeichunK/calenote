// Date utilities
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  addDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

// 格式化日期時間
export const formatDateTime = (date: string | Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

// 格式化日期
export const formatDate = (date: string | Date): string => {
  return formatDateTime(date, 'yyyy-MM-dd');
};

// 格式化時間
export const formatTime = (date: string | Date): string => {
  return formatDateTime(date, 'HH:mm');
};

// 格式化為人類可讀的時間
export const formatHumanReadable = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) {
    return `Today at ${formatTime(d)}`;
  }

  if (isTomorrow(d)) {
    return `Tomorrow at ${formatTime(d)}`;
  }

  if (isThisWeek(d)) {
    return format(d, 'EEEE \'at\' HH:mm');
  }

  return format(d, 'MMM d \'at\' HH:mm');
};

// 獲取日期範圍
export const getDateRange = (type: 'day' | 'week' | 'month', date: Date = new Date()) => {
  switch (type) {
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case 'week':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date),
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
};

// 檢查日期關係
export { isToday, isTomorrow, isThisWeek };

// 日期計算
export { addDays };

// 解析 ISO 字符串
export { parseISO };
