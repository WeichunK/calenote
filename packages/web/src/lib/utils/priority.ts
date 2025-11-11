/**
 * Priority utility functions
 * Centralized priority color and label management to avoid duplication
 */

const PRIORITY_COLORS = {
  dot: { 3: 'bg-red-500', 2: 'bg-yellow-500', 1: 'bg-green-500' },
  border: { 3: 'border-l-red-500', 2: 'border-l-yellow-500', 1: 'border-l-green-500' },
  label: { 3: 'High', 2: 'Medium', 1: 'Low' },
} as const;

export function getPriorityDotColor(priority?: number): string {
  return priority && priority > 0
    ? PRIORITY_COLORS.dot[priority as keyof typeof PRIORITY_COLORS.dot] || ''
    : '';
}

export function getPriorityBorderColor(priority?: number): string {
  return priority && priority > 0
    ? PRIORITY_COLORS.border[priority as keyof typeof PRIORITY_COLORS.border] || 'border-l-gray-300'
    : 'border-l-gray-300';
}

export function getPriorityLabel(priority?: number): string {
  return priority && priority > 0
    ? PRIORITY_COLORS.label[priority as keyof typeof PRIORITY_COLORS.label] || ''
    : '';
}
