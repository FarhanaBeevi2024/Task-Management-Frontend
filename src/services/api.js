import axios from 'axios';
import { supabase } from './supabase';

let accessToken = null;
/** Active workspace org (sent as X-Organization-Id for multi-org users). */
let activeOrganizationId = null;

export function setApiAccessToken(token) {
  accessToken = token || null;
}

export function setActiveOrganizationId(orgId) {
  activeOrganizationId = orgId ? String(orgId) : null;
}

export function getActiveOrganizationId() {
  return activeOrganizationId;
}

export const api = axios.create();

api.interceptors.request.use(async (config) => {
  const headers = { ...(config.headers || {}) };

  // Robust auth header: if our cached token is missing, pull it from Supabase session.
  if (!headers.Authorization) {
    const token = accessToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      try {
        const { data } = await supabase.auth.getSession();
        const latest = data?.session?.access_token;
        if (latest) headers.Authorization = `Bearer ${latest}`;
      } catch {
        // Ignore: we'll just send the request without auth and let backend return 401.
      }
    }
  }

  if (activeOrganizationId && !headers['X-Organization-Id']) {
    headers['X-Organization-Id'] = activeOrganizationId;
  }

  return { ...config, headers };
});
