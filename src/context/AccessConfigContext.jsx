import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../services/api';

const AccessConfigContext = createContext(null);

const DEFAULT_EMPTY = {
  global: {},
  project: {},
};

const DEFAULT_FEATURES = {
  enableInviteUser: true,
  enableAddUser: false,
  enableUserProjectAssociation: false,
};

const parseFrontendFlag = (rawValue) => {
  if (rawValue == null || rawValue === '') return undefined;
  const normalized = String(rawValue).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') return false;
  return undefined;
};

const FRONTEND_FEATURE_FLAGS = {
  enableInviteUser: parseFrontendFlag(import.meta.env.VITE_ENABLE_INVITE_USER),
  enableAddUser: parseFrontendFlag(import.meta.env.VITE_ENABLE_ADD_USER),
  enableUserProjectAssociation: parseFrontendFlag(import.meta.env.VITE_ENABLE_USER_PROJECT_ASSOCIATION),
};

const getFrontendFeatures = () => {
  return {
    enableInviteUser:
      FRONTEND_FEATURE_FLAGS.enableInviteUser === undefined
        ? DEFAULT_FEATURES.enableInviteUser
        : FRONTEND_FEATURE_FLAGS.enableInviteUser,
    enableAddUser:
      FRONTEND_FEATURE_FLAGS.enableAddUser === undefined
        ? DEFAULT_FEATURES.enableAddUser
        : FRONTEND_FEATURE_FLAGS.enableAddUser,
    enableUserProjectAssociation:
      FRONTEND_FEATURE_FLAGS.enableUserProjectAssociation === undefined
        ? DEFAULT_FEATURES.enableUserProjectAssociation
        : FRONTEND_FEATURE_FLAGS.enableUserProjectAssociation,
  };
};

export function AccessConfigProvider({ children, session }) {
  const [roles, setRoles] = useState(null);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    if (!session?.access_token) {
      setRoles(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/api/access-config');
      setRoles(data?.roles ?? null);
      setFeatures(getFrontendFeatures());
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load access config');
      setRoles(null);
      setFeatures(getFrontendFeatures());
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const getRole = useCallback(
    (globalRole) => {
      if (!roles || !globalRole) return DEFAULT_EMPTY;
      return roles[globalRole] || roles.user || DEFAULT_EMPTY;
    },
    [roles]
  );

  const value = useMemo(
    () => ({
      roles,
      features,
      loading,
      error,
      refetch: fetchConfig,
      getRole,
      canManageUsers: (r) => getRole(r).global?.canManageUsers === true,
      canUserCreateProject: (r) => getRole(r).global?.canCreateProjects === true,
      canManageMilestones: (r) => getRole(r).project?.canManageMilestones === true,
      canCreateIssues: (r) => getRole(r).project?.canCreateIssues === true,
      canAssignIssuesToOthers: (r) => getRole(r).project?.canAssignIssuesToOthers === true,
      canManageProjectMembers: (r) => getRole(r).project?.canManageMembers === true,
      canViewAllProjects: (r) => getRole(r).global?.canViewAllProjects === true,
      canViewAllUsers: (r) => getRole(r).global?.canViewAllUsers === true,
      canInviteUser: () => features.enableInviteUser === true,
      canAddUser: () => features.enableAddUser === true,
      canConfigureUserProjectAssociation: () => features.enableUserProjectAssociation === true,
      /**
       * Milestones sidebar: hidden for global/project "client" unless canManageMilestones is on.
       * Other roles see the menu (read-only in MilestonesView when manage is off).
       */
      canShowMilestonesNav: (globalRole, projectRole) => {
        if (getRole(globalRole).project?.canManageMilestones === true) return true;
        const isClientGlobal =
          globalRole === 'client' || globalRole === 'representative';
        const isProjectClient = projectRole === 'client';
        return !isClientGlobal && !isProjectClient;
      },
      async saveRoleAccess(nextRoles) {
        const { data } = await api.put('/api/admin/role-access', { roles: nextRoles });
        setRoles(data?.roles ?? null);
        return data;
      },
    }),
    [roles, features, loading, error, fetchConfig, getRole]
  );

  return (
    <AccessConfigContext.Provider value={value}>{children}</AccessConfigContext.Provider>
  );
}

export function useAccessConfig() {
  const ctx = useContext(AccessConfigContext);
  if (!ctx) {
    throw new Error('useAccessConfig must be used within AccessConfigProvider');
  }
  return ctx;
}
