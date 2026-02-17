import React from 'react';
import './IssueCard.css';

const IssueCard = ({ issue, onClick, onStatusChange }) => {
  const issueType = issue.issue_type || {};
  const statusConfig = {
    to_do: { color: '#6b7280', bg: '#f3f4f6', label: 'To Do' },
    in_progress: { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
    in_review: { color: '#f59e0b', bg: '#fef3c7', label: 'In Review' },
    done: { color: '#10b981', bg: '#d1fae5', label: 'Completed' }
  };

  const priorityConfig = {
    lowest: { color: '#9ca3af', label: 'Lowest' },
    low: { color: '#6b7280', label: 'Low' },
    medium: { color: '#f59e0b', label: 'Medium' },
    high: { color: '#f97316', label: 'High' },
    highest: { color: '#ef4444', label: 'Highest' }
  };

  const status = statusConfig[issue.status] || statusConfig.to_do;
  const priority = priorityConfig[issue.priority] || priorityConfig.medium;

  return (
    <div className="issue-card" onClick={onClick}>
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
          <span 
            className="priority-badge"
            style={{ color: priority.color }}
          >
            {priority.label}
          </span>
          {issue.assignee_id && (
            <div className="assignee-avatar">
              {issue.assignee?.email?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        {onStatusChange ? (
          <select
            value={issue.status}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(issue.id, e.target.value);
            }}
            className="status-select"
            onClick={(e) => e.stopPropagation()}
            style={{ borderColor: status.color }}
          >
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Completed</option>
          </select>
        ) : (
          <span 
            className="status-badge"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default IssueCard;

