export const startOfUTCDay = (date: Date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const addUTCDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

export const recentUTCDays = (days: number, endDate: Date = startOfUTCDay()) => {
  return Array.from({ length: days }, (_v, idx) => {
    const offset = days - idx - 1;
    const day = new Date(endDate);
    day.setUTCDate(endDate.getUTCDate() - offset);
    return startOfUTCDay(day);
  });
};
