/**
 * Formats ISO date string to readable football fixture format.
 * Matches user's exact specification: "Sun 18 Oct, 07:00"
 */
export const formatMatchDateTime = (isoString) => {
  if (!isoString) return 'Date to be scheduled';
  let d;
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(isoString)) {
    const [datePart, timePart] = isoString.slice(0, 16).split('T');
    const [y, m, day] = datePart.split('-').map(Number);
    const [h, min] = timePart.split(':').map(Number);
    d = new Date(y, m - 1, day, h, min);
  } else {
    d = new Date(isoString);
  }
  if (isNaN(d.getTime())) return 'Date to be scheduled';

  // Format: "Sun 18 Oct, 07:00"
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${weekday} ${day} ${month}, ${hours}:${minutes}`;
};

/**
 * Converts ISO string to datetime-local input value (YYYY-MM-DDTHH:mm)
 */
export const toDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(isoString)) {
    return isoString.slice(0, 16);
  }
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Converts datetime-local input string to ISO string for backend
 */
export const fromDateTimeLocal = (dateTimeLocalStr) => {
  if (!dateTimeLocalStr || !dateTimeLocalStr.trim()) return null;
  const trimmed = dateTimeLocalStr.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed;
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};
