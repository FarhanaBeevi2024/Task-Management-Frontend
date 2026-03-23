import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getAssigneeInitialsFromEmail } from '../utils/assigneeInitials.js';
import { useAccessConfig } from '../context/AccessConfigContext.jsx';
import WorkflowStatusSelect from './WorkflowStatusSelect.jsx';
import { normalizeWorkflowStatus } from '../constants/workflowStatus.js';
import './IssueDetail.css';

const statusOptions = [
  { value: 'to_do', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Completed' }
];

const priorityOptions = [
  { value: 'P1', label: 'P1 - Highest' },
  { value: 'P2', label: 'P2 - High' },
  { value: 'P3', label: 'P3 - Medium' },
  { value: 'P4', label: 'P4 - Low' },
  { value: 'P5', label: 'P5 - Lowest' }
];

const IssueDetail = ({ issue, session, onClose, onEdit, onUpdate, onAddSubtask, userRole }) => {
  const { canAssignIssuesToOthers, canManageMilestones } = useAccessConfig();
  const canAssignOthers = canAssignIssuesToOthers(userRole ?? 'user');
  const canPickMilestone = canManageMilestones(userRole ?? 'user');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('to_do');
  const [internalPriority, setInternalPriority] = useState('P3');
  const [clientPriority, setClientPriority] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [labels, setLabels] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [actualDays, setActualDays] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [exposedToClient, setExposedToClient] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const isClientUser = userRole === 'client';

  useEffect(() => {
    if (issue) {
      setSummary(issue.summary || '');
      setDescription(issue.description || '');
      setStatus(issue.status || 'to_do');
      const p = issue.internal_priority || issue.priority || 'P3';
      const priorityMap = { 'highest': 'P1', 'high': 'P2', 'medium': 'P3', 'low': 'P4', 'lowest': 'P5' };
      setInternalPriority(priorityMap[p] && priorityMap[p] !== 'exposed_to_client' ? priorityMap[p] : (p === 'exposed_to_client' ? 'P3' : p || 'P3'));
      setClientPriority(issue.client_priority || '');
      setStoryPoints(issue.story_points ?? '');
      setLabels(Array.isArray(issue.labels) ? issue.labels.join(', ') : (issue.labels || ''));
      setDueDate(issue.due_date ? issue.due_date.slice(0, 10) : '');
      setEstimatedDays(issue.estimated_days ?? '');
      setActualDays(issue.actual_days ?? '');
      setAssigneeId(issue.assignee_id || '');
      setMilestoneId(issue.milestone_id || '');
      setExposedToClient(issue.exposed_to_client === true);
      setWorkflowStatus(normalizeWorkflowStatus(issue.workflow_status));
    }
  }, [issue]);

  useEffect(() => {
    if (canAssignOthers && session) {
      api.get('/api/users').then((res) => {
        setTeamMembers(Array.isArray(res.data) ? res.data : []);
      }).catch((err) => console.error('Error fetching team members:', err));
    }
  }, [canAssignOthers, session]);

  useEffect(() => {
    if (issue?.project?.id && session) {
      api.get(`/api/jira/projects/${issue.project.id}/milestones`).then((res) => setMilestones(res.data ?? [])).catch(() => setMilestones([]));
    }
  }, [issue?.project?.id, session]);

  useEffect(() => {
    if (issue?.id) fetchComments();
  }, [issue?.id]);

  useEffect(() => {
    if (issue?.id && session) fetchActivityLogs();
  }, [issue?.id, session]);

  const fetchActivityLogs = async () => {
    if (!issue?.id || !session) return;
    try {
      setLoadingActivity(true);
      const response = await api.get(`/api/jira/issues/${issue.id}/activity-logs`);
      setActivityLogs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setActivityLogs([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/jira/issues/${issue.id}/comments`);
      setComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put(
        `/api/jira/issues/${issue.id}`,
        {
          summary,
          description,
          status,
          internal_priority: internalPriority,
          client_priority: clientPriority || null,
          story_points: storyPoints ? parseInt(storyPoints, 10) : null,
          labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : [],
          due_date: dueDate || null,
          estimated_days: estimatedDays === '' ? null : parseInt(estimatedDays, 10),
          actual_days: actualDays === '' ? null : parseInt(actualDays, 10),
          assignee_id: assigneeId || null,
          milestone_id: milestoneId || null,
          exposed_to_client: exposedToClient,
          ...(isClientUser ? {} : { workflow_status: workflowStatus }),
        }
      );
      if (onUpdate) onUpdate(response.data);
      fetchActivityLogs();
    } catch (error) {
      console.error('Error updating issue:', error);
      alert(error.response?.data?.error || 'Failed to update issue');
    } finally {
      setSaving(false);
    }
  };

  const formatActivityMessage = (log) => {
    const name = log.performed_by_email ? log.performed_by_email.split('@')[0] : 'Someone';
    const cap = (s) => (s && s.length) ? (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')) : '—';
    const fmt = (v) => (v == null || v === '') ? '—' : String(v);
    switch (log.action_type) {
      case 'CREATE':
        return `${name} created this issue`;
      case 'STATUS_CHANGE':
        return `${name} changed status from '${cap(log.old_value)}' to '${cap(log.new_value)}'`;
      case 'PRIORITY_CHANGE':
        return `${name} changed ${(log.field_name === 'client_priority' ? 'client priority' : 'priority')} from '${fmt(log.old_value)}' to '${fmt(log.new_value)}'`;
      case 'ASSIGNMENT_CHANGE':
        return `${name} changed assignee`;
      case 'DUE_DATE_CHANGE':
        return `${name} changed due date from '${fmt(log.old_value)}' to '${fmt(log.new_value)}'`;
      case 'MILESTONE_CHANGE':
        return `${name} changed milestone`;
      case 'SUMMARY_CHANGE':
        return `${name} updated summary`;
      case 'DESCRIPTION_CHANGE':
        return `${name} updated description`;
      case 'UPDATE':
        if (log.field_name === 'workflow_status') {
          return `${name} changed workflow status from '${fmt(log.old_value)}' to '${fmt(log.new_value)}'`;
        }
        return `${name} updated ${log.field_name || 'field'} from '${fmt(log.old_value)}' to '${fmt(log.new_value)}'`;
      case 'COMMENT_ADDED':
        return `${name} added a comment`;
      case 'DELETE':
        return `${name} deleted this issue`;
      default:
        return `${name} updated ${log.field_name || 'field'} from '${fmt(log.old_value)}' to '${fmt(log.new_value)}'`;
    }
  };

  const formatActivityDate = (performedAt) => {
    if (!performedAt) return '';
    const d = new Date(performedAt);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/api/jira/issues/${issue.id}/comments`, {
        body: newComment
      });
      setNewComment('');
      fetchComments();
      fetchActivityLogs();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const statusConfig = {
    to_do: { color: '#6b7280', bg: '#f3f4f6', label: 'To Do' },
    in_progress: { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
    in_review: { color: '#f59e0b', bg: '#fef3c7', label: 'In Review' },
    done: { color: '#10b981', bg: '#d1fae5', label: 'Completed' }
  };

  const issueType = issue?.issue_type || {};

  return (
    <div className="issue-detail-overlay" onClick={onClose}>
      <div className="issue-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-header-left">
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="detail-header-right">
            <button
              type="button"
              className="detail-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="icon-btn" title="Time">🕐</button>
            <button className="icon-btn" title="Star">⭐</button>
            <button className="icon-btn" title="More">⋯</button>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-title-section">
            <input
              type="text"
              className="detail-title-input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Issue summary"
            />
            <div className="detail-key">{issue?.issue_key}</div>
            {issue?.milestone && (
              <div className="detail-milestone-badge">
                Milestone: <strong>{issue.milestone.version}</strong>
                {issue.milestone.planned_date && ` (${new Date(issue.milestone.planned_date).toLocaleDateString()})`}
              </div>
            )}
          </div>

          <div className="detail-meta detail-meta-editable">
            <div className="meta-item">
              <span className="meta-label">Created time:</span>
              <span className="meta-value">
                {issue?.created_at ? new Date(issue.created_at).toLocaleString() : '—'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <select
                className="detail-select status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="meta-item meta-item--workflow-status">
              <span className="meta-label">Workflow status:</span>
              <WorkflowStatusSelect
                value={workflowStatus}
                onChange={setWorkflowStatus}
                readOnly={isClientUser}
                showBadge
                className="detail-workflow-status-field"
                selectClassName="detail-select"
              />
            </div>
            <div className="meta-item">
              <span className="meta-label">Internal Priority:</span>
              <select
                className="detail-select"
                value={internalPriority}
                onChange={(e) => setInternalPriority(e.target.value)}
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="meta-item">
              <span className="meta-label">Client Priority:</span>
              <select
                className="detail-select"
                value={clientPriority}
                onChange={(e) => setClientPriority(e.target.value)}
              >
                <option value="">Not Set</option>
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="meta-item" style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="exposed-to-client-detail"
                checked={exposedToClient}
                onChange={(e) => setExposedToClient(e.target.checked)}
              />
              <label className="meta-label" htmlFor="exposed-to-client-detail" style={{ margin: 0, cursor: 'pointer' }}>Exposed to client</label>
            </div>
            <div className="meta-item">
              <span className="meta-label">Story Points:</span>
              <input
                type="number"
                className="detail-input detail-input-sm"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="—"
                min="0"
                max="100"
              />
            </div>
            <div className="meta-item">
              <span className="meta-label">Due Date:</span>
              <input
                type="date"
                className="detail-input detail-input-sm"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="meta-item">
              <span className="meta-label">Planned (days/hours):</span>
              <input
                type="number"
                className="detail-input detail-input-sm"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="—"
                min="0"
                max="365"
              />
            </div>
            <div className="meta-item">
              <span className="meta-label">Actual (days/hours taken):</span>
              <input
                type="number"
                className="detail-input detail-input-sm"
                value={actualDays}
                onChange={(e) => setActualDays(e.target.value)}
                placeholder="—"
                min="0"
                max="365"
              />
            </div>
            <div className="meta-item">
              <span className="meta-label">Labels:</span>
              <input
                type="text"
                className="detail-input"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="comma-separated labels"
              />
            </div>
            {canPickMilestone && milestones.length > 0 ? (
              <div className="meta-item">
                <span className="meta-label">Milestone:</span>
                <select
                  className="detail-select"
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  style={{ minWidth: '160px' }}
                >
                  <option value="">No Milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>{m.version}</option>
                  ))}
                </select>
              </div>
            ) : issue?.milestone && !canPickMilestone ? (
              <div className="meta-item">
                <span className="meta-label">Milestone:</span>
                <span className="meta-value">{issue.milestone.version}</span>
              </div>
            ) : null}
            {canAssignOthers ? (
              <div className="meta-item">
                <span className="meta-label">Assign To:</span>
                <select
                  className="detail-select"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  style={{ minWidth: '180px' }}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.email} {u.role && `(${u.role})`}
                    </option>
                  ))}
                </select>
              </div>
            ) : issue?.assignee && (
              <div className="meta-item">
                <span className="meta-label">Assigned to:</span>
                <div className="assignees-list">
                  <div className="assignee-avatar-small">
                    {getAssigneeInitialsFromEmail(issue.assignee?.email)}
                  </div>
                  <span className="meta-value">{issue.assignee?.email ?? '—'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="detail-description">
            <h3>Description</h3>
            <textarea
              className="detail-description-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="No description provided."
              rows={6}
            />
          </div>

          {onAddSubtask && (
            <div className="detail-subtasks">
              <div className="detail-subtasks-header">
                <h3>Subtasks</h3>
                <button
                  type="button"
                  className="btn-add-subtask"
                  onClick={() => onAddSubtask(issue)}
                >
                  + Add subtask
                </button>
              </div>
              {issue?.subtasks?.length > 0 ? (
                <ul className="subtasks-list">
                  {issue.subtasks.map((st) => (
                    <li key={st.id} className="subtask-item">
                      <span className="subtask-key">{st.issue_key}</span>
                      <span className="subtask-summary">{st.summary}</span>
                      {st.status && (
                        <span className={`subtask-status status-${st.status}`}>{st.status.replace('_', ' ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtasks-empty">No subtasks yet. Add one to break down this issue.</p>
              )}
            </div>
          )}

          <div className="detail-tabs">
            <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</button>
            <button className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>Comments</button>
          </div>

          <div className="detail-activity">
            {activeTab === 'activity' && (
              <div className="activity-section activity-log-section">
                <h4 className="activity-log-title">History</h4>
                {loadingActivity ? (
                  <p className="activity-log-loading">Loading activity...</p>
                ) : activityLogs.length === 0 ? (
                  <p className="activity-log-empty">No activity recorded yet.</p>
                ) : (
                  <ul className="activity-log-list">
                    {activityLogs.map((log) => (
                      <li key={log.id} className="activity-log-item">
                        <div className="activity-avatar">
                          {log.performed_by_email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="activity-content">
                          <div className="activity-text">
                            {formatActivityMessage(log)}
                            <span className="activity-log-date"> – {formatActivityDate(log.performed_at)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="comments-section">
                <h4>Comments ({Array.isArray(comments) ? comments.length : 0})</h4>
                {(Array.isArray(comments) ? comments : []).map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      {comment.author?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <strong>{comment.author?.email?.split('@')[0] || 'User'}</strong>
                        <span className="comment-time">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="comment-body">{comment.body}</div>
                    </div>
                  </div>
                ))}

                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows="3"
                    className="comment-input"
                  />
                  <button type="submit" className="comment-submit-btn">
                    Add Comment
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;

