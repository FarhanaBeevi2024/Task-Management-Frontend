import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserManagement.css';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'team_member', label: 'Team member' },
  { value: 'team_leader', label: 'Team leader' },
  { value: 'client', label: 'Client user' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super admin' },
];

function UserManagement({ session }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setUsers(response.data || []);
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
      await axios.put(
        `/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
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

  const handleToggleActive = async (userId, currentActive) => {
    try {
      setTogglingUserId(userId);
      setError('');
      await axios.put(
        `/api/admin/users/${userId}/active`,
        { active: !currentActive },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
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
            Manage roles and activation for all users.
          </p>
        </div>
      </div>

      {error && <div className="um-error">{error}</div>}

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
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                    disabled={savingUserId === user.user_id}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`um-status-pill ${user.active ? 'active' : 'inactive'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
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
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="um-empty">
                  No users found yet. Ask users to sign up, then assign roles here.
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

