import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [exposedToClient, setExposedToClient] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

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
      setExposedToClient(issue.exposed_to_client === true);
    }
  }, [issue]);

  const canAssign = userRole === 'team_leader';

  useEffect(() => {
    if (canAssign && session) {
      axios.get('/api/users', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).then((res) => {
        setTeamMembers(Array.isArray(res.data) ? res.data : []);
      }).catch((err) => console.error('Error fetching team members:', err));
    }
  }, [canAssign, session]);

  useEffect(() => {
    if (issue?.id) fetchComments();
  }, [issue?.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/jira/issues/${issue.id}/comments`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put(
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
          exposed_to_client: exposedToClient
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      if (onUpdate) onUpdate(response.data);
    } catch (error) {
      console.error('Error updating issue:', error);
      alert(error.response?.data?.error || 'Failed to update issue');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(`/api/jira/issues/${issue.id}/comments`, {
        body: newComment
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setNewComment('');
      fetchComments();
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
            {canAssign ? (
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
                    {issue.assignee.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="meta-value">{issue.assignee.email}</span>
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
            <button className="tab-btn active">Activity</button>
            <button className="tab-btn">My Work</button>
            <button className="tab-btn">Assigned</button>
            <button className="tab-btn">Comments</button>
          </div>

          <div className="detail-activity">
            <div className="activity-section">
              <div className="activity-date">Today</div>
              <div className="activity-item">
                <div className="activity-avatar">
                  {issue.reporter?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{issue.reporter?.email?.split('@')[0] || 'User'}</strong> created {issue.issue_key}
                  </div>
                  <div className="activity-time">
                    {new Date(issue.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="comments-section">
              <h4>Comments ({comments.length})</h4>
              {comments.map(comment => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;

