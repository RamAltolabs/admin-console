// Utility functions for the Admin Console UI

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for 10 digit US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }

  // Return original if not 10 digits
  return phone;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format
 */
export const isValidPhone = (phone: string): boolean => {
  // At least 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10;
};

/**
 * Truncate text to a certain length
 */
export const truncateText = (text: string, length: number = 50): string => {
  if (text.length <= length) {
    return text;
  }
  return text.substring(0, length) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get status badge color
 */
export const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-400',
    inactive: 'bg-yellow-400',
    suspended: 'bg-red-400',
  };
  return colors[status] || 'bg-gray-400';
};

/**
 * Export data as JSON file
 */
export const downloadAsJson = (data: any, filename: string = 'export.json'): void => {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Export data as CSV file
 */
export const downloadAsCSV = (data: any[], filename: string = 'export.csv'): void => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  const element = document.createElement('a');
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Debounce function
 */
export const debounce = (func: Function, delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Handle async error gracefully
 */
export const handleAsyncError = async (
  promise: Promise<any>,
  onError?: (error: any) => void
): Promise<any> => {
  try {
    return await promise;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    console.error('Async error:', error);
    return null;
  }
};

/**
 * Compare dates
 */
export const isRecentDate = (dateString: string, daysBack: number = 7): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysBack;
};

/**
 * Sort array by property
 */
export const sortByProperty = <T>(
  array: T[],
  property: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];

    if (aVal < bVal) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Group array by property
 */
export const groupByProperty = <T>(
  array: T[],
  property: keyof T
): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const key = String(item[property]);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Unique values from array
 */
export const getUniqueValues = <T>(
  array: T[],
  property: keyof T
): any[] => {
  return [...new Set(array.map(item => item[property]))];
};

/**
 * Sleep/delay promise
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
