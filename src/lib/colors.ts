import type { JobState } from '@/api/types';

export const STATE_COLORS: Record<JobState, string> = {
  available: '#3B82F6',
  scheduled: '#A78BFA',
  pending: '#94A3B8',
  active: '#F59E0B',
  completed: '#22C55E',
  retryable: '#F97316',
  cancelled: '#6B7280',
  discarded: '#EF4444',
};

export const STATE_BG: Record<JobState, string> = {
  available: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  active: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  retryable: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  discarded: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
