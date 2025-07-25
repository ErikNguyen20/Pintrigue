/**
 * Formats a date object into a human-readable "time ago" string.
 * @param {*} date - The date object to format.
 * @returns {string} - The formatted time ago string.
 */
export function FormatTimeAgo(date) {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    const minutes = Math.floor(diffSec / 60);
    const hours = Math.floor(diffSec / 3600);
    const days = Math.floor(diffSec / (3600 * 24));
    const weeks = Math.floor(days / 7);
    const years = Math.floor(days / 365);

    if (years >= 1) {
        return `${years}y ago`;
    } else if (weeks >= 1) {
        return `${weeks}w ago`;
    } else if (days >= 1) {
        return `${days}d ago`;
    } else if (hours >= 1) {
        return `${hours}h ago`;
    } else if (minutes >= 1) {
        return `${minutes}m ago`;
    } else {
        return `just now`;
    }
}
