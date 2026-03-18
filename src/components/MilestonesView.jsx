import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { canManageMilestones } from '../config/accessConfig.js';
import './MilestonesView.css';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'released', label: 'Released' },
];

function MilestonesView({ project, session, userRole }) {
  const [milestones, setMilestones] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formVersion, setFormVersion] = useState('');
  const [formPlannedDate, setFormPlannedDate] = useState('');
  const [formStatus, setFormStatus] = useState('planned');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = canManageMilestones(userRole);

  useEffect(() => {
    if (!project?.id) return;
    fetchData();
  }, [project?.id]);

  const fetchData = async () => {
    if (!project?.id) return;
    try {
      setLoading(true);
      setError('');
      const [milestonesRes, issuesRes] = await Promise.all([
        api.get(`/api/jira/projects/${project.id}/milestones`),
        api.get('/api/jira/issues', {
          params: { project_id: project.id },
        }),
      ]);
      setMilestones(milestonesRes.data ?? []);
      setIssues(issuesRes.data ?? []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(err.response?.data?.error || 'Failed to load milestones');
      setMilestones([]);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneProgress = (milestoneId) => {
    const byMilestone = issues.filter((i) => i.milestone_id === milestoneId);
    const total = byMilestone.length;
    const completed = byMilestone.filter((i) => i.status === 'done').length;
    return { total, completed };
  };

  const openCreate = () => {
    setEditingMilestone(null);
    setFormVersion('');
    setFormPlannedDate('');
    setFormStatus('planned');
    setFormDescription('');
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditingMilestone(m);
    setFormVersion(m.version || '');
    setFormPlannedDate(m.planned_date ? m.planned_date.slice(0, 10) : '');
    setFormStatus(m.status || 'planned');
    setFormDescription(m.description || '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMilestone(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formVersion.trim()) return;
    try {
      setSaving(true);
      if (editingMilestone) {
        await api.put(`/api/jira/milestones/${editingMilestone.id}`, {
          version: formVersion.trim(),
          planned_date: formPlannedDate || null,
          status: formStatus,
          description: formDescription.trim() || null,
        });
      } else {
        await api.post(`/api/jira/projects/${project.id}/milestones`, {
          version: formVersion.trim(),
          planned_date: formPlannedDate || null,
          status: formStatus,
          description: formDescription.trim() || null,
        });
      }
      closeForm();
      fetchData();
    } catch (err) {
      console.error('Error saving milestone:', err);
      setError(err.response?.data?.error || 'Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.version}"? Issues will be unassigned from this milestone.`)) return;
    try {
      await api.delete(`/api/jira/milestones/${milestone.id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting milestone:', err);
      setError(err.response?.data?.error || 'Failed to delete milestone');
    }
  };

  if (loading) {
    return <div className="milestones-view"><div className="milestones-loading">Loading milestones...</div></div>;
  }

  return (
    <div className="milestones-view">
      <div className="milestones-header">
        <div>
          <h1>Milestones</h1>
          <p>Release milestones for this project. Assign tasks to milestones when creating or editing issues.</p>
        </div>
        {canEdit && (
          <button type="button" className="milestones-add-btn" onClick={openCreate}>
            New milestone
          </button>
        )}
      </div>

      {error && <div className="milestones-error">{error}</div>}

      {milestones.length === 0 ? (
        <div className="milestones-empty">
          <p>No milestones yet.</p>
          {canEdit && <button type="button" className="milestones-add-btn" onClick={openCreate}>Create first milestone</button>}
        </div>
      ) : (
        <div className="milestones-list">
          {milestones.map((m) => {
            const { total, completed } = getMilestoneProgress(m.id);
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={m.id} className="milestone-card">
                <div className="milestone-card-header">
                  <div className="milestone-version">{m.version}</div>
                  <span className={`milestone-status-badge milestone-status-${m.status}`}>
                    {STATUS_OPTIONS.find((s) => s.value === m.status)?.label || m.status}
                  </span>
                  {canEdit && (
                    <div className="milestone-actions">
                      <button type="button" className="milestone-btn-edit" onClick={() => openEdit(m)} aria-label="Edit">Edit</button>
                      <button type="button" className="milestone-btn-delete" onClick={() => handleDelete(m)} aria-label="Delete">Delete</button>
                    </div>
                  )}
                </div>
                <div className="milestone-meta">
                  {m.planned_date && (
                    <span className="milestone-planned">Planned: {new Date(m.planned_date).toLocaleDateString()}</span>
                  )}
                  {m.description && <span className="milestone-desc">{m.description}</span>}
                </div>
                <div className="milestone-progress-wrap">
                  <div className="milestone-progress-bar">
                    <div className="milestone-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="milestone-progress-label">{completed} / {total} tasks completed</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="milestones-modal-overlay" onClick={closeForm}>
          <div className="milestones-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingMilestone ? 'Edit milestone' : 'New milestone'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="milestones-form-group">
                <label htmlFor="milestone-version">Version *</label>
                <input
                  id="milestone-version"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  placeholder="e.g. 1.0.0"
                  required
                />
              </div>
              <div className="milestones-form-group">
                <label htmlFor="milestone-planned">Planned date</label>
                <input
                  id="milestone-planned"
                  type="date"
                  value={formPlannedDate}
                  onChange={(e) => setFormPlannedDate(e.target.value)}
                />
              </div>
              <div className="milestones-form-group">
                <label htmlFor="milestone-status">Status</label>
                <select
                  id="milestone-status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="milestones-form-group">
                <label htmlFor="milestone-desc">Description</label>
                <textarea
                  id="milestone-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div className="milestones-form-actions">
                <button type="button" onClick={closeForm}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : (editingMilestone ? 'Save' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MilestonesView;
