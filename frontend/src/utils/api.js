import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./auth";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


// Create an Axios instance with your base config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Refresh token stored in cookies. Do this in FastAPI to get token: refresh_token = request.cookies.get("refresh_token")
  headers: {
    Accept: "application/json",
  },
});

// Add request interceptor to attach the access token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 and retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.startsWith("/auth")) {
      return Promise.reject(error);
    }

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const didRefresh = await tryRefreshToken();
      if (didRefresh) {
        const token = getAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest); // Retry original request
      }

      // If refresh failed
      clearAccessToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Actual refresh logic
export async function tryRefreshToken() {
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true, // Send refresh token cookie
      }
    );

    if (res.status === 200 && res.data?.access_token) {
      setAccessToken(res.data.access_token);
      return true;
    }
    console.error("Refresh token response did not contain access token");
    return false;
  } catch (error) {
    console.error(error.response?.data?.detail || "Failed to refresh token:");
    return false;
  }
}

// Your unified API function for React Query
export async function apiFetch(url, options = {}) {
  const method = options.method || "GET";
  const data = options.body || undefined;

  const response = await api.request({
    url,
    method,
    data,
    params: options.params,
    headers: options.headers,
  });

  return response.data;
}

/**
 * Uploads a file to the backend /file/upload-file endpoint.
 * @param {File} file - The file to upload.
 * @returns {Promise<object>} The response data (should contain the file URL).
 */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/file/upload-file", formData, {
    headers: {
      Accept: "application/json",
    },
  });

  return response.data;
}


export async function login({ username, password }) {
  try {
    const res = await api.post("/auth/login", { username, password });
    setAccessToken(res.data.access_token);
    return { success: true, data: res.data };
  } catch (error) {
    const message = error.response?.data?.detail || "Login failed.";
    return { success: false, error: message };
  }
}

export async function register({ email, username, password }) {
  try {
    const res = await api.post("/auth/register", { email, username, password });
    setAccessToken(res.data.access_token);
    return { success: true, data: res.data };
  } catch (error) {
    const message = error.response?.data?.detail || "Registration failed.";
    return { success: false, error: message };
  }
}


/**
 * FLOW:
 * 1️⃣ [App] ➜ redirect ➜
 * 2️⃣ [Google Consent] ➜
 * 3️⃣ [Backend Callback] — check if user exists
 *    - If yes: issue tokens, redirect to app
 *    - If new: redirect to /pick-username and issue temporary access token (Just the same JWT logic, but shorter expiry)
 * 4️⃣ [Frontend] ➜ shows username form ➜ POST to /auth/complete-oauth
 * 5️⃣ [Backend] ➜ creates user, issues tokens
 * 6️⃣ [Frontend] ➜ store access token
 */
export async function handleGoogleCallback(code) {
  try {
    const res = await api.post("/auth/google/callback", { code });
    if (res.data?.access_token) {
      setAccessToken(res.data.access_token);
      return { success: true };
    } else {
      return { success: false, error: "Missing access token in response." };
    }
  } catch (error) {
    const message = error.response?.data?.detail || "Google login failed.";
    return { success: false, error: message };
  }
}


export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.warn("Logout failed (may already be logged out):", error);
  } finally {
    clearAccessToken();
    window.location.href = "/auth"; // Redirect regardless
  }
}

