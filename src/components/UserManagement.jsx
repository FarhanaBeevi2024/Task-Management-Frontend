import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAccessConfig } from '../context/AccessConfigContext.jsx';
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
  const IconUserPlus = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M15.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-9 10.25c0-2.4 2.57-4.25 5.5-4.25 1.06 0 2.08.24 2.97.67a.75.75 0 0 1-.65 1.35 5.21 5.21 0 0 0-2.32-.52c-2.32 0-4 1.4-4 2.75a.75.75 0 1 1-1.5 0Z" fill="currentColor"/>
      <path d="M18 10.25a.75.75 0 0 1 .75.75v1.75h1.75a.75.75 0 0 1 0 1.5h-1.75V16a.75.75 0 0 1-1.5 0v-1.75H15.5a.75.75 0 0 1 0-1.5h1.75V11a.75.75 0 0 1 .75-.75Z" fill="currentColor"/>
    </svg>
  );
  const IconEdit = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M16.06 3.94a2 2 0 0 1 2.83 0l1.17 1.17a2 2 0 0 1 0 2.83l-9.2 9.2a2 2 0 0 1-.88.51l-3.1.78a.75.75 0 0 1-.91-.91l.78-3.1a2 2 0 0 1 .51-.88l9.2-9.2Zm1.77 1.06a.5.5 0 0 0-.71 0l-1.09 1.09 1.88 1.88L19 6.88a.5.5 0 0 0 0-.71L17.83 5Z" fill="currentColor"/>
      <path d="M4.75 19.25a.75.75 0 0 1 .75-.75h13a.75.75 0 0 1 0 1.5h-13a.75.75 0 0 1-.75-.75Z" fill="currentColor"/>
    </svg>
  );
  const { canInviteUser, canAddUser, canConfigureUserProjectAssociation } = useAccessConfig();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectIdsByUserId, setProjectIdsByUserId] = useState({});
  const [loading, setLoading] = useState(true);
  const [addingUserId, setAddingUserId] = useState(null);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrgRole, setInviteOrgRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserAllProjects, setNewUserAllProjects] = useState(true);
  const [newUserProjectSelection, setNewUserProjectSelection] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editActive, setEditActive] = useState(true);
  const [editAllProjects, setEditAllProjects] = useState(true);
  const [editProjectSelection, setEditProjectSelection] = useState([]);
  const [savingEditUser, setSavingEditUser] = useState(false);

  const inviteEnabled = canInviteUser();
  const addUserEnabled = canAddUser();
  const projectAssociationEnabled = canConfigureUserProjectAssociation();
  const allProjectIds = projects.map((p) => p.id);

  useEffect(() => {
    fetchUsers();
    if (projectAssociationEnabled) {
      fetchProjects();
      fetchProjectAssociations();
    }
  }, [projectAssociationEnabled]);

  useEffect(() => {
    if (newUserAllProjects && showCreateUserModal) {
      setNewUserProjectSelection(allProjectIds);
    }
  }, [allProjectIds.join(','), newUserAllProjects, showCreateUserModal]);

  useEffect(() => {
    if (editAllProjects && editUser) {
      setEditProjectSelection(allProjectIds);
    }
  }, [allProjectIds.join(','), editAllProjects, editUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/users', {
        params: { include_pending_signups: '1' },
      });
      const nextUsers = Array.isArray(response.data) ? response.data : [];
      setUsers(nextUsers.filter((u) => String(u?.role || '').toLowerCase() !== 'superadmin'));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/jira/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchProjectAssociations = async () => {
    try {
      const response = await api.get('/api/admin/user-project-associations');
      const rows = Array.isArray(response.data?.associations) ? response.data.associations : [];
      const map = {};
      rows.forEach((row) => {
        const userId = row.user_id;
        const projectId = row.project_id;
        if (!userId || !projectId) return;
        if (!map[userId]) map[userId] = [];
        map[userId].push(projectId);
      });
      setProjectIdsByUserId(map);
    } catch (err) {
      console.error('Error fetching project associations:', err);
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const email = newUserEmail.trim().toLowerCase();
    if (!email || !newUserPassword) {
      setError('Email and password are required');
      return;
    }
    try {
      setCreatingUser(true);
      setError('');
      const createRes = await api.post('/api/admin/users/create', {
        email,
        password: newUserPassword,
        first_name: newUserFirstName.trim(),
        last_name: newUserLastName.trim(),
        role: newUserRole,
      });
      const createdUserId = String(createRes?.data?.user_id || '');
      if (projectAssociationEnabled && createdUserId && !newUserAllProjects) {
        await api.put(`/api/admin/users/${createdUserId}/project-associations`, {
          project_ids: newUserProjectSelection,
        });
      }
      setShowCreateUserModal(false);
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserPassword('');
      setNewUserRole('user');
      setNewUserAllProjects(true);
      setNewUserProjectSelection([]);
      await fetchUsers();
      if (projectAssociationEnabled) {
        await fetchProjectAssociations();
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const toggleAddUserProjectSelection = (projectId) => {
    setNewUserProjectSelection((prev) => {
      const next = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];
      setNewUserAllProjects(allProjectIds.length > 0 && next.length === allProjectIds.length);
      return next;
    });
  };

  const toggleEditProjectSelection = (projectId) => {
    setEditProjectSelection((prev) => {
      const next = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];
      setEditAllProjects(allProjectIds.length > 0 && next.length === allProjectIds.length);
      return next;
    });
  };

  const openEditUser = (user) => {
    setEditUser(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditEmail(user.email || '');
    setEditPassword('');
    setEditRole(user.role === 'admin' ? 'admin' : 'user');
    setEditActive(Boolean(user.active));
    const explicitProjectIds = projectIdsByUserId[user.user_id];
    if (projectAssociationEnabled && Array.isArray(explicitProjectIds)) {
      const next = [...new Set(explicitProjectIds)];
      setEditProjectSelection(next);
      setEditAllProjects(allProjectIds.length > 0 && next.length === allProjectIds.length);
    } else {
      setEditAllProjects(true);
      setEditProjectSelection(allProjectIds);
    }
  };

  const handleSaveEditedUser = async (e) => {
    e.preventDefault();
    if (!editUser?.user_id) return;
    try {
      setSavingEditUser(true);
      setError('');
      await api.put(`/api/admin/users/${editUser.user_id}`, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        email: editEmail.trim().toLowerCase(),
        ...(editPassword ? { password: editPassword } : {}),
        role: editRole,
        active: editActive,
      });
      if (projectAssociationEnabled) {
        const response = await api.put(
          `/api/admin/users/${editUser.user_id}/project-associations`,
          { project_ids: editAllProjects ? [] : editProjectSelection }
        );
        const nextIds = Array.isArray(response.data?.project_ids) ? response.data.project_ids : [];
        setProjectIdsByUserId((prev) => {
          const copy = { ...prev };
          if (nextIds.length === 0) {
            delete copy[editUser.user_id];
          } else {
            copy[editUser.user_id] = nextIds;
          }
          return copy;
        });
      }
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Error editing user:', err);
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setSavingEditUser(false);
    }
  };

  const openCreateUserModal = () => {
    setNewUserEmail('');
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserPassword('');
    setNewUserRole('user');
    setNewUserAllProjects(true);
    setNewUserProjectSelection(allProjectIds);
    setShowCreateUserModal(true);
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
        {addUserEnabled && (
          <button type="button" className="um-primary-btn" onClick={openCreateUserModal}>
            + Add user
          </button>
        )}
      </div>

      {error && <div className="um-error">{error}</div>}

      {inviteEnabled && (
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
      )}

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
                    <span className="um-workspace-muted">Pending</span>
                  ) : user.role === 'admin' ? 'Admin' : 'User'}
                </td>
                <td>
                  <span className={`um-status-pill ${user.active ? 'active' : 'inactive'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="um-action-row">
                    {user.pending_org_membership && (
                      <button
                        type="button"
                        className="um-icon-btn um-icon-btn-add"
                        disabled={addingUserId === user.user_id}
                        onClick={() => handleAddToWorkspace(user.user_id)}
                        title="Add to workspace"
                        aria-label="Add to workspace"
                      >
                        {addingUserId === user.user_id ? '…' : <IconUserPlus />}
                      </button>
                    )}
                    <button
                      type="button"
                      className="um-icon-btn"
                      onClick={() => openEditUser(user)}
                      title="Edit user"
                      aria-label="Edit user"
                    >
                      <IconEdit />
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

      {showCreateUserModal && (
        <div className="um-modal-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="um-modal um-signup-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="um-modal-title">Create user</h3>
            <p className="um-signup-subtitle">Set up profile and credentials like signup.</p>
            <form className="um-modal-form um-signup-form" onSubmit={handleCreateUser}>
              <div className="um-signup-form-group">
                <label>First name</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="um-signup-form-group">
                <label>Last name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <div className="um-signup-form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="um-signup-form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="um-signup-form-group">
                <label>Workspace role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                  {WORKSPACE_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {projectAssociationEnabled && (
                <div className="um-signup-form-group um-project-access-block">
                  <label className="um-project-access-title">Project access</label>
                  <label className="um-check-label">
                    <input
                      type="checkbox"
                      checked={newUserAllProjects}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewUserAllProjects(checked);
                        setNewUserProjectSelection(checked ? allProjectIds : []);
                      }}
                    />
                    Select all
                  </label>
                  <div className="um-projects-list">
                    {projects.map((p) => (
                      <label key={p.id} className="um-project-option">
                        <input
                          type="checkbox"
                          checked={newUserProjectSelection.includes(p.id)}
                          onChange={() => toggleAddUserProjectSelection(p.id)}
                        />
                        <span>{p.name} ({p.key})</span>
                      </label>
                    ))}
                    {projects.length === 0 && (
                      <div className="um-empty">No projects found.</div>
                    )}
                  </div>
                </div>
              )}
              <div className="um-modal-actions">
                <button type="button" className="um-secondary-btn" onClick={() => setShowCreateUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="um-primary-btn" disabled={creatingUser}>
                  {creatingUser ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {editUser && (
        <div className="um-modal-overlay" onClick={() => setEditUser(null)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="um-modal-title">Edit user</h3>
            <form className="um-modal-form" onSubmit={handleSaveEditedUser}>
              <div className="um-signup-form-group">
                <label>First name</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="um-signup-form-group">
                <label>Last name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <div className="um-signup-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="um-signup-form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div className="um-signup-form-group">
                <label>Workspace role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={savingEditUser}
                >
                  {WORKSPACE_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="um-signup-form-group">
                <label>Status</label>
                <select
                  value={editActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditActive(e.target.value === 'active')}
                  disabled={savingEditUser}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {projectAssociationEnabled && (
                <div className="um-signup-form-group um-project-access-block">
                  <label className="um-project-access-title">Project access</label>
                  <label className="um-check-label">
                    <input
                      type="checkbox"
                      checked={editAllProjects}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditAllProjects(checked);
                        setEditProjectSelection(checked ? allProjectIds : []);
                      }}
                      disabled={savingEditUser}
                    />
                    Select all
                  </label>
                  <div className="um-projects-list">
                    {projects.map((p) => (
                      <label key={p.id} className="um-project-option">
                        <input
                          type="checkbox"
                          checked={editProjectSelection.includes(p.id)}
                          onChange={() => toggleEditProjectSelection(p.id)}
                          disabled={savingEditUser}
                        />
                        <span>{p.name} ({p.key})</span>
                      </label>
                    ))}
                    {projects.length === 0 && (
                      <div className="um-empty">No projects found.</div>
                    )}
                  </div>
                </div>
              )}
              <div className="um-modal-actions">
                <button type="button" className="um-secondary-btn" onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="um-primary-btn" disabled={savingEditUser}>
                  {savingEditUser ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
