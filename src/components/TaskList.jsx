import React from 'react';
import TaskCard from './TaskCard.jsx';
import './TaskList.css';

const TaskList = ({ tasks, onUpdate, onDelete, onEdit, currentUser, userRole, viewMode = 'list' }) => {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No tasks yet</h3>
        <p>Create your first task to get started!</p>
      </div>
    );
  }

  if (viewMode === 'board') {
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    return (
      <div className="task-board">
        {statuses.map(status => {
          const statusTasks = tasks.filter(task => task.status === status);
          return (
            <div key={status} className="board-column">
              <div className="board-column-header">
                <h3>{statusLabels[status]}</h3>
                <span className="task-count">{statusTasks.length}</span>
              </div>
              <div className="board-column-content">
                {statusTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    currentUser={currentUser}
                    userRole={userRole}
                    viewMode="board"
                  />
                ))}
                {statusTasks.length === 0 && (
                  <div className="empty-column">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
          currentUser={currentUser}
          userRole={userRole}
          viewMode="list"
        />
      ))}
    </div>
  );
};

export default TaskList;
