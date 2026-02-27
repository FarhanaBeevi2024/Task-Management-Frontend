import React from 'react';
import './IssueCard.css';

const IssueCard = ({ issue, onClick, onStatusChange, users = [], onAssign, onDragStart }) => {
  const issueType = issue.issue_type || {};
  const statusConfig = {
    to_do: { color: '#6b7280', bg: '#f3f4f6', label: 'To Do' },
    in_progress: { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
    in_review: { color: '#f59e0b', bg: '#fef3c7', label: 'In Review' },
    done: { color: '#10b981', bg: '#d1fae5', label: 'Completed' }
  };

  const priorityConfig = {
    P1: { color: '#ef4444', label: 'P1' },
    P2: { color: '#f97316', label: 'P2' },
    P3: { color: '#f59e0b', label: 'P3' },
    P4: { color: '#6b7280', label: 'P4' },
    P5: { color: '#9ca3af', label: 'P5' },
    // Backward compatibility with old values
    lowest: { color: '#9ca3af', label: 'P5' },
    low: { color: '#6b7280', label: 'P4' },
    medium: { color: '#f59e0b', label: 'P3' },
    high: { color: '#f97316', label: 'P2' },
    highest: { color: '#ef4444', label: 'P1' }
  };

  const status = statusConfig[issue.status] || statusConfig.to_do;
  const internalPriority = priorityConfig[issue.internal_priority || issue.priority] || priorityConfig.P3;
  const clientPriority = issue.client_priority ? priorityConfig[issue.client_priority] : null;

  const assigneeValue = issue.assignee_id || issue.assignee?.id || '';
  const currentUser =
    users.find((u) => u.user_id === assigneeValue) || null;
  const assigneeEmail = currentUser?.email || issue.assignee?.email || '';
  const assigneeInitial = assigneeEmail
    ? assigneeEmail.charAt(0).toUpperCase()
    : '?';

  return (
    <div
      className="issue-card"
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        if (onDragStart) onDragStart(issue.id);
      }}
    >
      <div className="issue-header">
        <div className="issue-key-type">
          <span className="issue-key">{issue.issue_key}</span>
          <span 
            className="issue-type-badge"
            style={{ 
              backgroundColor: issueType.color ? `${issueType.color}20` : '#f3f4f6',
              color: issueType.color || '#6b7280'
            }}
          >
            {issueType.icon} {issueType.name}
          </span>
        </div>
        {issue.story_points && (
          <div className="story-points">{issue.story_points} SP</div>
        )}
      </div>
      <h4 className="issue-summary">{issue.summary}</h4>
      {issue.description && (
        <p className="issue-description">{issue.description}</p>
      )}
      <div className="issue-footer">
        <div className="issue-meta">
          <div className="assignee-avatar">
            {assigneeInitial}
          </div>
        </div>
        {onAssign && (
          <div className="assignee-select-wrapper" onClick={(e) => e.stopPropagation()}>
            <select
              value={assigneeValue}
              onChange={(e) => {
                const value = e.target.value || null;
                onAssign(issue.id, value);
              }}
              className="assignee-select"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCard;

