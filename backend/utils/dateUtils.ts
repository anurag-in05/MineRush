function isSameCalendarDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPreviousCalendarDay(lastDate: Date | null, currentDate: Date | null): boolean {
  if (!lastDate || !currentDate) return false;

  const last = new Date(lastDate);
  const current = new Date(currentDate);
  last.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const oneDay = 1000 * 60 * 60 * 24;
  return (current.getTime() - last.getTime()) / oneDay === 1;
}

export { isPreviousCalendarDay, isSameCalendarDay };
