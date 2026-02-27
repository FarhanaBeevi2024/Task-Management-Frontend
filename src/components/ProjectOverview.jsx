import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProjectOverview.css';

const PROJECT_ROLES = [
  'superadmin',
  'admin',
  'team_leader',
  'team_member',
  'client',
  'viewer',
];

function ProjectOverview({ project, session, userRole }) {
  const [localProject, setLocalProject] = useState(project);
  const [editing, setEditing] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectRole, setSelectedProjectRole] = useState('team_member');

  const canManageMembers =
    userRole === 'superadmin' || userRole === 'admin';

  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    fetchMembers();
    if (canManageMembers) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, canManageMembers]);

  const fetchMembers = async () => {
    if (!project) return;
    try {
      setLoadingMembers(true);
      setError('');
      const response = await axios.get(`/api/jira/projects/${project.id}/members`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setMembers(response.data || []);
    } catch (err) {
      console.error('Error fetching project members:', err);
      setError(err.response?.data?.error || 'Failed to load project members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleProjectSave = async (e) => {
    e.preventDefault();
    if (!project) return;
    try {
      setSavingProject(true);
      setError('');
      const payload = {
        name: localProject.name,
        description: localProject.description,
      };
      const response = await axios.put(
        `/api/jira/projects/${project.id}`,
        payload,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setLocalProject(response.data);
      setEditing(false);
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.error || 'Failed to update project');
    } finally {
      setSavingProject(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedProjectRole || !project) return;
    try {
      setError('');
      await axios.post(
        `/api/jira/projects/${project.id}/members`,
        {
          user_id: selectedUserId,
          project_role: selectedProjectRole,
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setSelectedUserId('');
      setSelectedProjectRole('team_member');
      fetchMembers();
    } catch (err) {
      console.error('Error adding project member:', err);
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!project) return;
    if (!window.confirm('Remove this user from the project?')) return;
    try {
      setError('');
      await axios.delete(
        `/api/jira/projects/${project.id}/members/${memberUserId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId));
    } catch (err) {
      console.error('Error removing project member:', err);
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (!project) {
    return (
      <div className="project-overview">
        <p>No project selected.</p>
      </div>
    );
  }

  return (
    <div className="project-overview">
      <section className="project-section">
        <div className="project-header">
          <div>
            <div className="project-key">{localProject.key}</div>
            <h2 className="project-name">{localProject.name}</h2>
          </div>
          {canManageMembers && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Cancel' : 'Edit overview'}
            </button>
          )}
        </div>
        {error && <div className="project-error">{error}</div>}
        {editing ? (
          <form onSubmit={handleProjectSave} className="project-form">
            <div className="form-group">
              <label>Project name</label>
              <input
                type="text"
                value={localProject.name || ''}
                onChange={(e) =>
                  setLocalProject((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={localProject.description || ''}
                onChange={(e) =>
                  setLocalProject((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={savingProject}>
                {savingProject ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <p className="project-description">
            {localProject.description || 'No description yet.'}
          </p>
        )}
      </section>

      <section className="project-section">
        <div className="project-header">
          <h3 className="section-title">Project members</h3>
        </div>
        {loadingMembers ? (
          <div className="project-loading">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="project-empty">No members yet.</div>
        ) : (
          <table className="project-members-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Global role</th>
                <th>Project role</th>
                {canManageMembers && <th />}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id}>
                  <td>{m.email}</td>
                  <td>{m.global_role}</td>
                  <td>{m.project_role}</td>
                  {canManageMembers && (
                    <td>
                      <button
                        type="button"
                        className="link-btn-danger"
                        onClick={() => handleRemoveMember(m.user_id)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {canManageMembers && (
          <form onSubmit={handleAddMember} className="add-member-form">
            <h4>Add user to this project</h4>
            <div className="form-row-inline">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingUsers}
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.email} ({u.role})
                  </option>
                ))}
              </select>
              <select
                value={selectedProjectRole}
                onChange={(e) => setSelectedProjectRole(e.target.value)}
              >
                {PROJECT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button type="submit" className="submit-btn" disabled={!selectedUserId}>
                Add
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default ProjectOverview;

