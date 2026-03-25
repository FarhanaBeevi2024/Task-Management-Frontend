import React, { useEffect, useMemo, useState } from 'react';
import { useAccessConfig } from '../context/AccessConfigContext.jsx';
import './RolesManagement.css';

const GLOBAL_ROLE_KEYS = ['admin', 'user'];
const PROJECT_ROLE_KEYS = ['admin', 'team_leader', 'team_member', 'client'];

const ROLE_LABELS = {
  admin: 'Admin',
  team_leader: 'Team leader',
  team_member: 'Team member',
  client: 'Client',
  user: 'User (default)',
};

const GLOBAL_PERMISSIONS = [
  { key: 'canManageUsers', label: 'Manage users & assign global roles' },
  { key: 'canViewAllUsers', label: 'View all users (assignment lists, directory)' },
  { key: 'canCreateProjects', label: 'Create projects' },
  { key: 'canViewAllProjects', label: 'View all projects (not only member projects)' },
];

const PROJECT_PERMISSIONS = [
  { key: 'autoMemberOnCreate', label: 'Auto-add self as project member when creating a project' },
  { key: 'canManageMembers', label: 'Manage project members' },
  { key: 'canCreateIssues', label: 'Create issues / tasks' },
  { key: 'canAssignIssuesToOthers', label: 'Assign issues to other users' },
  { key: 'canManageMilestones', label: 'Manage milestones' },
];

function cloneRoles(src) {
  const out = {};
  const roleKeys = Object.keys(src || {});
  for (const rk of roleKeys) {
    const row = src?.[rk];
    out[rk] = {
      global: { ...(row?.global || {}) },
      project: { ...(row?.project || {}) },
    };
  }
  for (const rk of [...new Set([...GLOBAL_ROLE_KEYS, ...PROJECT_ROLE_KEYS])]) {
    if (out[rk]) continue;
    const row = src?.[rk];
    out[rk] = {
      global: { ...(row?.global || {}) },
      project: { ...(row?.project || {}) },
    };
  }
  return out;
}

function RolesManagement({ userRole }) {
  const { roles, loading, error, refetch, saveRoleAccess, canManageUsers } = useAccessConfig();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('organization');

  const allowed = useMemo(() => canManageUsers(userRole), [canManageUsers, userRole]);

  useEffect(() => {
    if (roles) setDraft(cloneRoles(roles));
  }, [roles]);

  const toggle = (roleKey, section, permKey, checked) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = cloneRoles(prev);
      next[roleKey][section] = { ...next[roleKey][section], [permKey]: checked };
      return next;
    });
  };

  const handleSave = async () => {
    if (!draft || !allowed) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveRoleAccess(draft);
      setMessage({ type: 'success', text: 'Role access saved. Changes apply immediately.' });
    } catch (e) {
      setMessage({
        type: 'error',
        text: e?.response?.data?.error || e?.message || 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (roles) setDraft(cloneRoles(roles));
    setMessage(null);
  };

  if (!allowed) {
    return (
      <div className="roles-management roles-management--denied">
        <h1>Access Control</h1>
        <p>You do not have permission to configure role access.</p>
      </div>
    );
  }

  if (loading && !draft) {
    return (
      <div className="roles-management">
        <h1>Roles</h1>
        <p className="roles-management-muted">Loading access configuration…</p>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="roles-management">
        <h1>Access Control</h1>
        <p className="roles-management-error">{error}</p>
        <button type="button" className="roles-management-btn" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="roles-management dashboard-main-content">
      <div className="roles-management-header">
        <div>
          <h1>Access Control</h1>
          <p className="roles-management-subtitle">
            Configure access for workspace roles (<strong>Admin</strong> and <strong>User</strong>)
            across organization and project actions.
          </p>
        </div>
        <div className="roles-management-actions">
          <button type="button" className="roles-management-btn secondary" onClick={handleReset} disabled={saving}>
            Reset
          </button>
          <button type="button" className="roles-management-btn primary" onClick={handleSave} disabled={saving || !draft}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`roles-management-banner roles-management-banner--${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="roles-management-tabs" role="tablist" aria-label="Access control sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'organization'}
          className={`roles-tab ${activeTab === 'organization' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('organization')}
        >
          Organization Access
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'project'}
          className={`roles-tab ${activeTab === 'project' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('project')}
        >
          Project Access
        </button>
      </div>

      <div className="roles-management-grid">
        {activeTab === 'organization' && GLOBAL_ROLE_KEYS.map((roleKey) => (
          <section key={`global-${roleKey}`} className="roles-card">
            <h2 className="roles-card-title">{ROLE_LABELS[roleKey] || roleKey}</h2>
            <p className="roles-card-key">
              <code>{roleKey}</code>
            </p>
            <ul className="roles-perm-list">
              {GLOBAL_PERMISSIONS.map(({ key, label }) => (
                <li key={key}>
                  <label className="roles-perm-row">
                    <input
                      type="checkbox"
                      checked={Boolean(draft?.[roleKey]?.global?.[key])}
                      onChange={(e) => toggle(roleKey, 'global', key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {activeTab === 'project' && PROJECT_ROLE_KEYS.map((roleKey) => (
          <section key={`project-${roleKey}`} className="roles-card">
            <h2 className="roles-card-title">{ROLE_LABELS[roleKey] || roleKey}</h2>
            <p className="roles-card-key">
              <code>{roleKey}</code>
            </p>
            <ul className="roles-perm-list">
              {PROJECT_PERMISSIONS.map(({ key, label }) => (
                <li key={key}>
                  <label className="roles-perm-row">
                    <input
                      type="checkbox"
                      checked={Boolean(draft?.[roleKey]?.project?.[key])}
                      onChange={(e) => toggle(roleKey, 'project', key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export default RolesManagement;
