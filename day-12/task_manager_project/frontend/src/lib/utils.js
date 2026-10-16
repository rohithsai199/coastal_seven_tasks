import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes safely, resolving conflicts.
 * Used by all Shadcn/ui-style components.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the Tailwind status variant class for a given task status.
 */
export function getStatusClass(status) {
  const map = {
    pending: 'status-pending',
    in_progress: 'status-in_progress',
    completed: 'status-completed',
  }
  return map[status] || 'status-pending'
}

/**
 * Formats a date string to a readable format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Truncates text to a given character limit.
 */
export function truncate(text, limit = 80) {
  if (!text) return ''
  return text.length > limit ? text.slice(0, limit) + '…' : text
}
