import axios from 'axios';

let accessToken = null;

export function setApiAccessToken(token) {
  accessToken = token || null;
}

export const api = axios.create();

api.interceptors.request.use((config) => {
  const headers = config.headers || {};

  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return { ...config, headers };
});

