import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setActiveOrganizationId } from '../services/api';

const OrganizationContext = createContext(null);

const STORAGE_KEY = 'taskmgmt_active_org_id';

export function OrganizationProvider({ children, session, onOrganizationChange }) {
  const [ready, setReady] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setLocalActiveId] = useState(null);

  const load = useCallback(async () => {
    setReady(false);
    try {
      const res = await api.get('/api/me/organizations');
      if (res.data?.is_superadmin) {
        setOrganizations([]);
        setLocalActiveId(null);
        setActiveOrganizationId(null);
        setReady(true);
        return;
      }
      const list = Array.isArray(res.data?.organizations) ? res.data.organizations : [];
      setOrganizations(list);
      if (list.length === 0) {
        setLocalActiveId(null);
        setActiveOrganizationId(null);
        setReady(true);
        return;
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      const pick =
        list.find((o) => String(o.id) === String(saved)) || list[0];
      setLocalActiveId(pick.id);
      setActiveOrganizationId(pick.id);
      localStorage.setItem(STORAGE_KEY, String(pick.id));
    } catch {
      setOrganizations([]);
      setLocalActiveId(null);
      setActiveOrganizationId(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setReady(true);
      return;
    }
    load();
  }, [session?.access_token, load]);

  const switchOrganization = useCallback(
    (orgId) => {
      const id = String(orgId);
      if (!organizations.some((o) => String(o.id) === id)) return;
      setLocalActiveId(id);
      setActiveOrganizationId(id);
      localStorage.setItem(STORAGE_KEY, id);
      if (onOrganizationChange) onOrganizationChange();
    },
    [organizations, onOrganizationChange]
  );

  const value = useMemo(
    () => ({
      ready,
      organizations,
      activeOrganizationId,
      switchOrganization,
      reloadOrganizations: load,
    }),
    [ready, organizations, activeOrganizationId, switchOrganization, load]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    return {
      ready: true,
      organizations: [],
      activeOrganizationId: null,
      switchOrganization: () => {},
      reloadOrganizations: async () => {},
    };
  }
  return ctx;
}
