import { clsx } from 'clsx';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Combine class names conditionally
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format date smartly based on how recent it is
 */
export function formatSmartDate(date) {
  const d = new Date(date);
  if (isToday(d)) {
    return `Today, ${format(d, 'h:mm a')}`;
  }
  if (isYesterday(d)) {
    return `Yesterday, ${format(d, 'h:mm a')}`;
  }
  return format(d, 'MMM d, h:mm a');
}

/**
 * Get relative time string
 */
export function getRelativeTime(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(confidence) {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Get risk level configuration
 */
export function getRiskConfig(level) {
  const configs = {
    danger: {
      label: 'Danger',
      color: 'text-danger-600',
      bg: 'bg-danger-50',
      border: 'border-danger-200',
    },
    warning: {
      label: 'Warning',
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      border: 'border-warning-200',
    },
    safe: {
      label: 'Safe',
      color: 'text-safe-600',
      bg: 'bg-safe-50',
      border: 'border-safe-200',
    },
  };
  return configs[level] || configs.safe;
}

/**
 * Get animal icon by type
 */
export function getAnimalIcon(type) {
  const icons = {
    elephant: '🐘',
    tiger: '🐅',
    lion: '🦁',
    leopard: '🐆',
    bear: '🐻',
    bison: '🦬',
    boar: '🐗',
    human: '🧑',
    deer: '🦌',
    monkey: '🐒',
    peacock: '🦚',
  };
  return icons[type] || '🐾';
}

/**
 * Get battery status color
 */
export function getBatteryColor(percentage) {
  if (percentage >= 60) return 'text-safe-600';
  if (percentage >= 30) return 'text-warning-600';
  return 'text-danger-600';
}

/**
 * Get signal strength color
 */
export function getSignalColor(strength) {
  if (strength >= 60) return 'text-safe-600';
  if (strength >= 30) return 'text-warning-600';
  return 'text-danger-600';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
