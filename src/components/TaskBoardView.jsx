import React from 'react';
import JiraBoard from '../pages/JiraBoard.jsx';
import './TaskBoardView.css';

const VIEW_TABS = [
  // { key: 'overview', label: 'Overview' },
  { key: 'board', label: 'Board' },
  // { key: 'list', label: 'List' },
  // { key: 'table', label: 'Table' },
  // { key: 'timeline', label: 'Timeline' },
];

/**
 * Board view when a project is selected: breadcrumbs, title, view tabs, and the issue board.
 */
function TaskBoardView({
  project,
  session,
  activeView,
  onViewChange,
  onBackToProjects,
  onIssueClick,
  onCreateIssueClick,
  boardRefreshKey = 0,
}) {
  return (
    <>
      <div className="task-board-header">
        <div className="breadcrumbs">
          <button type="button" className="breadcrumb-link" onClick={onBackToProjects}>
            ← Team spaces
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Tasks</span>
        </div>
        <div className="header-title">
          <h1>Tasks</h1>
          <p>Short description will be placed here</p>
        </div>
        <div className="view-tabs">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`view-tab ${activeView === tab.key ? 'active' : ''}`}
              onClick={() => onViewChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="board-container">
        <JiraBoard
          key={boardRefreshKey}
          project={project}
          session={session}
          onIssueClick={onIssueClick}
        />
      </div>

      <button
        type="button"
        className="create-issue-fab"
        onClick={onCreateIssueClick}
        title="Create issue"
        aria-label="Create issue"
      >
        +
      </button>
    </>
  );
}

export default TaskBoardView;
