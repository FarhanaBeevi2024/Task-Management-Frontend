import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import './UserManagement.css';

const WORKSPACE_ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const INVITE_WORKSPACE_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

function UserManagement({ session }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [addingUserId, setAddingUserId] = useState(null);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrgRole, setInviteOrgRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/users', {
        params: { include_pending_signups: '1' },
      });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setSavingUserId(userId);
      setError('');
      await api.put(
        `/api/admin/users/${userId}/role`,
        { role: newRole }
      );
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.error || 'Failed to update role');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAddToWorkspace = async (userId) => {
    try {
      setAddingUserId(userId);
      setError('');
      await api.post('/api/organization/add-member', {
        user_id: userId,
        org_role: 'user',
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error adding user to organization:', err);
      setError(err.response?.data?.error || 'Failed to add user to workspace');
    } finally {
      setAddingUserId(null);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    try {
      setInviting(true);
      setError('');
      setInviteSuccess('');
      setInviteLink('');
      const res = await api.post('/api/organization/invitations', {
        email,
        role: inviteOrgRole,
      });
      if (res.data?.added_existing_user) {
        setInviteSuccess(
          'That email already has an account — they were added to this workspace. No signup link was needed.'
        );
        setInviteEmail('');
        await fetchUsers();
        return;
      }
      const url = res.data?.signup_url || '';
      setInviteLink(url);
      setInviteEmail('');
      if (res.data?.email_send_error) {
        setError(`Invite link generated, but email failed to send: ${res.data.email_send_error}`);
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      setError(err.response?.data?.error || 'Failed to create invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      setTogglingUserId(userId);
      setError('');
      await api.put(
        `/api/admin/users/${userId}/active`,
        { active: !currentActive }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, active: !currentActive } : u
        )
      );
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err.response?.data?.error || 'Failed to update user status');
    } finally {
      setTogglingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="um-header">
          <h2>Users</h2>
        </div>
        <div className="um-loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="um-header">
        <div>
          <h2>Users</h2>
          <p className="um-subtitle">
            Workspace roles are <strong>Admin</strong> or <strong>User</strong>. Project roles (team leader,
            client, etc.) are set per project on the project members list.
          </p>
        </div>
      </div>

      {error && <div className="um-error">{error}</div>}

      <section className="um-invite-card">
        <h3 className="um-invite-title">Invite user</h3>
        <p className="um-invite-help">
          We&apos;ll create a signup link for this email. Share the link (or send it by email from your
          mail client). New users finish name and password on the invite page; users who already have an
          account are linked to this organization and can sign in as usual.
        </p>
        <form className="um-invite-form" onSubmit={handleSendInvite}>
          <input
            type="email"
            className="um-invite-input"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <select
            className="um-invite-select"
            value={inviteOrgRole}
            onChange={(e) => setInviteOrgRole(e.target.value)}
            aria-label="Workspace role for this organization"
          >
            {INVITE_WORKSPACE_ROLES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit" className="um-invite-btn" disabled={inviting}>
            {inviting ? 'Creating…' : 'Create invite link'}
          </button>
        </form>
        {inviteSuccess && (
          <div
            className="um-invite-result"
            style={{ borderColor: '#bbf7d0', background: '#f0fdf4', color: '#166534' }}
          >
            {inviteSuccess}
          </div>
        )}
        {inviteLink && (
          <div className="um-invite-result">
            <div className="um-invite-result-label">Signup link (copy and send)</div>
            <div className="um-invite-url-wrap">
              <input type="text" readOnly className="um-invite-url" value={inviteLink} />
              <button
                type="button"
                className="um-invite-copy"
                onClick={() => navigator.clipboard?.writeText(inviteLink)}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="um-table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>
                  {user.email}
                  {user.pending_org_membership && (
                    <div className="um-workspace-pending" style={{ marginTop: '0.35rem' }}>
                      <span className="um-pending-badge" title="Signed up but not linked to your organization yet">
                        Pending workspace
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  {user.pending_org_membership ? (
                    <span className="um-workspace-muted">—</span>
                  ) : (
                    <select
                      value={user.role === 'admin' ? 'admin' : 'user'}
                      onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                      disabled={savingUserId === user.user_id}
                    >
                      {WORKSPACE_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  <span className={`um-status-pill ${user.active ? 'active' : 'inactive'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {user.pending_org_membership && (
                      <button
                        type="button"
                        className="um-add-workspace-btn"
                        disabled={addingUserId === user.user_id}
                        onClick={() => handleAddToWorkspace(user.user_id)}
                      >
                        {addingUserId === user.user_id ? 'Adding…' : 'Add to workspace'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="um-toggle-btn"
                      disabled={togglingUserId === user.user_id}
                      onClick={() => handleToggleActive(user.user_id, user.active)}
                    >
                      {togglingUserId === user.user_id
                        ? 'Updating...'
                        : user.active
                        ? 'Deactivate'
                        : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="um-empty">
                  No users in this organization yet. Send invites above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;
