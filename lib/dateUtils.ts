import { AttendanceRecord } from './types';

export const isSameMonth = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

export const filterRecordsByRange = (
  records: AttendanceRecord[],
  range: 'this-month' | 'last-3-months' | 'last-6-months' | 'custom',
  customStart?: string,
  customEnd?: string
) => {
  const now = new Date();
  // Reset time part for accurate date comparison if needed, but simple comparison works for ISO strings usually.
  // However, let's be precise with Date objects.

  return records.filter((record) => {
    const recordDate = new Date(record.date);

    switch (range) {
      case 'this-month':
        return (
          recordDate.getFullYear() === now.getFullYear() &&
          recordDate.getMonth() === now.getMonth() &&
          recordDate <= now
        );
      case 'last-3-months': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        // Reset to start of that day
        threeMonthsAgo.setHours(0, 0, 0, 0);
        return recordDate >= threeMonthsAgo && recordDate <= now;
      }
      case 'last-6-months': {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        return recordDate >= sixMonthsAgo && recordDate <= now;
      }
      case 'custom':
        if (!customStart || !customEnd) return true;
        const start = new Date(customStart);
        const end = new Date(customEnd);
        // Set end date to end of day to include records on that day
        end.setHours(23, 59, 59, 999);
        // Start date at 00:00
        start.setHours(0, 0, 0, 0);
        
        // recordDate is from YYYY-MM-DD string, so it defaults to 00:00 UTC usually. 
        // We should treat record.date as local date.
        // Let's just compare string values for simplicity or ensure consistent parsing.
        // Best way:
        const rDate = new Date(record.date);
        rDate.setHours(0,0,0,0);
        
        return rDate >= start && rDate <= end;
      default:
        return true;
    }
  });
};
