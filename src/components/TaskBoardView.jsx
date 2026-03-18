import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import JiraBoard from '../pages/JiraBoard.jsx';
import './TaskBoardView.css';

/**
 * Board page when a project is selected: header with back link and the issue board.
 * Clients (project_role === 'client') see only IN PROGRESS and COMPLETED columns.
 */
function TaskBoardView({
  project,
  session,
  onBackToProjects,
  onIssueClick,
  onCreateIssueClick,
  boardRefreshKey = 0,
}) {
  const roleFromProject = project?.current_user_project_role ?? null;
  const [fetchedRole, setFetchedRole] = useState(null);

  // Fallback: if project from list didn't include role, fetch it (e.g. after refresh or different nav path).
  useEffect(() => {
    if (!project?.id || roleFromProject != null) {
      setFetchedRole(null);
      return;
    }
    let cancelled = false;
    api
      .get(`/api/jira/projects/${project.id}/my-role`)
      .then((res) => {
        if (!cancelled && res.data?.project_role != null) {
          setFetchedRole(res.data.project_role);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchedRole(null);
      });
    return () => { cancelled = true; };
  }, [project?.id, roleFromProject, session?.access_token]);

  const projectRole = roleFromProject ?? fetchedRole ?? null;

  return (
    <>
      <div className="board-container">
        <JiraBoard
          key={boardRefreshKey}
          project={project}
          session={session}
          onIssueClick={onIssueClick}
          projectRole={projectRole}
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
