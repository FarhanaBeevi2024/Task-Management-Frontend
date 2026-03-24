import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import './SuperAdminDashboard.css';

function SuperAdminDashboard({ onLogout }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [adminInviteEmail, setAdminInviteEmail] = useState({});
  const [adminInviteLink, setAdminInviteLink] = useState({});
  const [invitingOrgId, setInvitingOrgId] = useState(null);

  const stats = useMemo(() => {
    const total = orgs.length;
    const active = orgs.filter((o) => o.status === 'active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [orgs]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/superadmin/organizations-overview');
      setOrgs(res.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = (newOrgName || '').trim();
    if (!name) return;
    try {
      setCreating(true);
      setError('');
      await api.post('/api/organizations', { name });
      setNewOrgName('');
      await load();
    } catch (e2) {
      setError(e2.response?.data?.error || e2.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const setEmailForOrg = (orgId, value) => {
    setAdminInviteEmail((prev) => ({ ...prev, [orgId]: value }));
  };

  const inviteOrgAdmin = async (orgId) => {
    const email = (adminInviteEmail[orgId] || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Enter a valid admin email for this organization');
      return;
    }
    try {
      setInvitingOrgId(orgId);
      setError('');
      const res = await api.post(`/api/superadmin/organizations/${orgId}/invite-admin`, { email });
      const url = res.data?.signup_url || '';
      setAdminInviteLink((prev) => ({ ...prev, [orgId]: url }));
      setEmailForOrg(orgId, '');
      if (res.data?.email_send_error) {
        setError(`Invite link generated, but email failed to send: ${res.data.email_send_error}`);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to invite admin');
    } finally {
      setInvitingOrgId(null);
    }
  };

  const toggleStatus = async (org) => {
    const next = org.status === 'active' ? 'inactive' : 'active';
    try {
      setError('');
      await api.patch(`/api/organizations/${org.id}`, { status: next });
      setOrgs((prev) => prev.map((o) => (o.id === org.id ? { ...o, status: next } : o)));
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to update organization');
    }
  };

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div>
          <h1>SuperAdmin</h1>
          <p>Manage organizations on the platform.</p>
        </div>
        <div className="sa-header-actions">
          <button type="button" className="sa-btn" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="sa-btn sa-btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="sa-stats">
        <div className="sa-stat">
          <div className="sa-stat-label">Total orgs</div>
          <div className="sa-stat-value">{stats.total}</div>
        </div>
        <div className="sa-stat">
          <div className="sa-stat-label">Active</div>
          <div className="sa-stat-value">{stats.active}</div>
        </div>
        <div className="sa-stat">
          <div className="sa-stat-label">Inactive</div>
          <div className="sa-stat-value">{stats.inactive}</div>
        </div>
      </section>

      <section className="sa-card">
        <h2>Create organization</h2>
          <p className="sa-card-hint">
          After creating an organization, invite an <strong>Admin</strong> below. They complete signup via the link
          and receive role <strong>Admin</strong> for both the workspace and platform.
        </p>
        <form className="sa-form" onSubmit={handleCreate}>
          <input
            className="sa-input"
            placeholder="Organization name"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
          <button className="sa-btn sa-btn-primary" type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>

      <section className="sa-card">
        <div className="sa-card-header">
          <h2>Organizations</h2>
        </div>
        {error && <div className="sa-error">{error}</div>}
        {loading ? (
          <div className="sa-loading">Loading organizations...</div>
        ) : orgs.length === 0 ? (
          <div className="sa-empty">No organizations yet.</div>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Members</th>
                  <th>Projects</th>
                  <th>Issues</th>
                  <th>Created</th>
                  <th>Invite admin</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="sa-org-name">{o.name}</div>
                      <div className="sa-org-id">{o.id}</div>
                    </td>
                    <td>
                      <span className={`sa-pill ${o.status === 'active' ? 'active' : 'inactive'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>{o.members_count}</td>
                    <td>{o.projects_count}</td>
                    <td>{o.issues_count}</td>
                    <td>{o.created_at ? new Date(o.created_at).toLocaleString() : ''}</td>
                    <td>
                      <div className="sa-invite-cell">
                        <input
                          type="email"
                          className="sa-input sa-input-inline"
                          placeholder="admin@company.com"
                          value={adminInviteEmail[o.id] || ''}
                          onChange={(e) => setEmailForOrg(o.id, e.target.value)}
                          disabled={o.status !== 'active'}
                        />
                        <button
                          type="button"
                          className="sa-btn sa-btn-small"
                          disabled={o.status !== 'active' || invitingOrgId === o.id}
                          onClick={() => inviteOrgAdmin(o.id)}
                        >
                          {invitingOrgId === o.id ? 'Sending…' : 'Send link'}
                        </button>
                        {adminInviteLink[o.id] && (
                          <div className="sa-invite-link-row">
                            <input
                              type="text"
                              readOnly
                              className="sa-invite-link-input"
                              value={adminInviteLink[o.id]}
                            />
                            <button
                              type="button"
                              className="sa-link"
                              onClick={() => navigator.clipboard?.writeText(adminInviteLink[o.id])}
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="sa-link"
                        onClick={() => toggleStatus(o)}
                      >
                        {o.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SuperAdminDashboard;

