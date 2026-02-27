import React from 'react';
import JiraBoard from '../pages/JiraBoard.jsx';
import './TaskBoardView.css';

/**
 * Board page when a project is selected: header with back link and the issue board.
 * Overview is a separate sidebar item / page; no tabs here.
 */
function TaskBoardView({
  project,
  session,
  onBackToProjects,
  onIssueClick,
  onCreateIssueClick,
  boardRefreshKey = 0,
}) {
  return (
    <>
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
