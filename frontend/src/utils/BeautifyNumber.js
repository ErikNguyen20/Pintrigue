/**
 * Beautify large numbers into K, M, B notation.
 * @param {number} num - The number to format.
 * @returns {string} - The formatted string.
 */
export function BeautifyNumber(num) {
    if (num === null || num === undefined) return "0";
    if (num < 10_000) return num.toString();
    if (num < 1_000_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    if (num < 1_000_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
}
