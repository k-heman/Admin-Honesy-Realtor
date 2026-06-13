// Utility formatters for the admin dashboard

/**
 * Format a number as Indian Rupee currency
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '—';
  const num = Number(value);
  if (isNaN(num)) return value;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Format a Firestore timestamp or date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(timestamp);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

/**
 * Truncate long strings
 */
export const truncate = (str, maxLength = 50) => {
  if (!str) return '—';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

/**
 * Get status badge color class
 */
export const getStatusColor = (status) => {
  const map = {
    available: 'success',
    sold: 'danger',
    rented: 'warning',
    pending: 'warning',
    Pending: 'warning',
    Contacted: 'info',
    Interested: 'success',
    Closed: 'secondary',
    active: 'success',
    inactive: 'secondary',
    'Super Admin': 'purple',
    Admin: 'info',
    Manager: 'warning',
    Agent: 'secondary',
  };
  return map[status] || 'secondary';
};

/**
 * Generate a unique ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Debounce function
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
