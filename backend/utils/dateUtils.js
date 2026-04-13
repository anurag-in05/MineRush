function isSameCalendarDay(a, b) {
    if (!a || !b) {
        return false;
    }

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isPreviousCalendarDay(lastDate, currentDate) {
    if (!lastDate || !currentDate) {
        return false;
    }

    const last = new Date(lastDate);
    const current = new Date(currentDate);
    last.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    const oneDay = 1000 * 60 * 60 * 24;
    return (current - last) / oneDay === 1;
}

module.exports = {
    isPreviousCalendarDay,
    isSameCalendarDay
};
