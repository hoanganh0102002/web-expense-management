/**
 * Date Helper Utilities for Dashboard Time Filtering
 */

export const formatDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getThisWeekRange = (now: Date) => {
  const day = now.getDay();
  // In JS getDay() returns 0 for Sunday. We map Monday=1, ..., Sunday=7.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start_date: formatDate(monday),
    end_date: formatDate(sunday)
  };
};

export const getThisMonthRange = (now: Date) => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start_date: formatDate(start),
    end_date: formatDate(end)
  };
};

export const getThisQuarterRange = (now: Date) => {
  const quarter = Math.floor(now.getMonth() / 3);
  const startMonth = quarter * 3;
  const start = new Date(now.getFullYear(), startMonth, 1);
  const end = new Date(now.getFullYear(), startMonth + 3, 0);
  return {
    start_date: formatDate(start),
    end_date: formatDate(end)
  };
};

export const getThisYearRange = (now: Date) => {
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return {
    start_date: formatDate(start),
    end_date: formatDate(end)
  };
};

export const getDateRangeForFilter = (
  filterType: 'week' | 'month' | 'quarter' | 'year' | 'custom',
  customStart?: string,
  customEnd?: string
): { start_date: string; end_date: string } => {
  const now = new Date();
  
  switch (filterType) {
    case 'week':
      return getThisWeekRange(now);
    case 'month':
      return getThisMonthRange(now);
    case 'quarter':
      return getThisQuarterRange(now);
    case 'year':
      return getThisYearRange(now);
    case 'custom':
      return {
        start_date: customStart || formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end_date: customEnd || formatDate(now)
      };
    default:
      return getThisMonthRange(now);
  }
};
