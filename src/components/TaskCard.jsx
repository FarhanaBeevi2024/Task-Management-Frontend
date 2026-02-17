import React from 'react';
import './TaskCard.css';

const TaskCard = ({ task, onUpdate, onDelete, onEdit, currentUser, userRole, viewMode = 'list' }) => {
  const canEdit = 
    userRole === 'team_leader' || 
    (userRole === 'team_member' && task.assigned_to === currentUser.id) ||
    (userRole === 'user' && task.created_by === currentUser.id);

  const canDelete = 
    userRole === 'team_leader' || 
    task.created_by === currentUser.id;

  const statusConfig = {
    pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
    in_progress: { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
    completed: { color: '#10b981', bg: '#d1fae5', label: 'Completed' },
    cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'Cancelled' }
  };

  const priorityConfig = {
    low: { color: '#10b981', bg: '#d1fae5' },
    medium: { color: '#f59e0b', bg: '#fef3c7' },
    high: { color: '#ef4444', bg: '#fee2e2' }
  };

  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  if (viewMode === 'board') {
    return (
      <div className="task-card task-card-board">
        <div className="task-card-header-board">
          <div className="task-priority-badge" style={{ backgroundColor: priority.bg, color: priority.color }}>
            {task.priority || 'medium'}
          </div>
          {canEdit && (
            <div className="task-menu">
              <button className="task-menu-btn" onClick={() => onEdit && onEdit(task)}>✏️</button>
              {canDelete && (
                <button className="task-menu-btn" onClick={() => onDelete(task.id)}>🗑️</button>
              )}
            </div>
          )}
        </div>
        <h3 className="task-title-board">{task.title}</h3>
        {task.description && (
          <p className="task-description-board">{task.description}</p>
        )}
        <div className="task-footer-board">
          <div className="task-status-select-wrapper">
            {canEdit ? (
              <select
                value={task.status}
                onChange={(e) => onUpdate(task.id, { status: e.target.value })}
                className="task-status-select-board"
                style={{ borderColor: status.color }}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            ) : (
              <span className="task-status-badge-board" style={{ backgroundColor: status.bg, color: status.color }}>
                {status.label}
              </span>
            )}
          </div>
          {task.due_date && (
            <div className="task-due-date">
              📅 {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="task-card task-card-list">
      <div className="task-card-content">
        <div className="task-main-info">
          <div className="task-header-list">
            <h3 className="task-title">{task.title}</h3>
            <div className="task-badges">
              <span 
                className="task-status-badge" 
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {status.label}
              </span>
              <span 
                className="task-priority-badge-list" 
                style={{ backgroundColor: priority.bg, color: priority.color }}
              >
                {task.priority || 'medium'}
              </span>
            </div>
          </div>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
          <div className="task-meta-list">
            {task.due_date && (
              <div className="meta-item-list">
                <span className="meta-icon">📅</span>
                <span>{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="meta-item-list">
              <span className="meta-icon">⚡</span>
              <span>Priority: {task.priority || 'medium'}</span>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="task-actions-list">
            <select
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value })}
              className="status-select-list"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {onEdit && (
              <button 
                onClick={() => onEdit(task)} 
                className="action-btn edit-btn-list"
                title="Edit task"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button 
                onClick={() => onDelete(task.id)} 
                className="action-btn delete-btn-list"
                title="Delete task"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
