import { tryRefreshToken } from './api';


/**
 * Stores the current access token in memory, initialized from localStorage.
 * @type {string|null}
 */
let accessToken = localStorage.getItem("access_token");

/**
 * Retrieves the current access token from memory.
 * @returns {string|null} The access token, or null if not set.
 */
export const getAccessToken = () => accessToken;

/**
 * Sets the access token in memory and persists it to localStorage.
 * @param {string} token - The JWT access token to store.
 */
export const setAccessToken = (token) => {
    accessToken = token;
    localStorage.setItem("access_token", token);
};

/**
 * Clears the access token from memory and removes it from localStorage.
 */
export const clearAccessToken = () => {
    accessToken = null;
    localStorage.removeItem("access_token");
};

/**
 * Checks if the user is currently logged in by validating the JWT token.
 * @returns {boolean} True if the token exists and is not expired, false otherwise.
 */
export async function isLoggedIn() {
    const token = getAccessToken();
    if (!token) return false;

    try {
        const [, payloadBase64] = token.split('.');
        const payload = JSON.parse(atob(payloadBase64));
        const now = Math.floor(Date.now() / 1000);

        if (typeof payload.exp === 'number' && payload.exp > now) {
            return true;
        } else {
            // Token expired, try to refresh
            const didRefresh = await tryRefreshToken();
            return didRefresh;
        }
    } catch {
        // Malformed token or decode error
        return false;
    }
}

/**
 * Extracts the username from the JWT access token.
 * @returns {string|null} The username if present, otherwise null.
 */
export function getUsernameFromToken() {
    const token = getAccessToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || null;
    } catch {
        return null;
    }
}