import React from 'react';
import './RecentIssuesView.css';

/**
 * Recent issues list view: header and list of issues across all projects.
 * Clicking an issue invokes onIssueClick(issue).
 */
function RecentIssuesView({ issues, onIssueClick }) {
  const formatKey = (issue) =>
    issue.issue_key || (issue.project?.key && issue.id ? `${issue.project.key}-${issue.id.slice(0, 8)}` : '—');

  return (
    <>
      <div className="recent-issues-view-header">
        <div>
          <h1>Recent issues</h1>
          <p>All your issues across projects. Click one to open its project and view details.</p>
        </div>
      </div>

      <div className="recent-issues-view-content">
        {issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No issues yet</h3>
            <p>Select a project and create an issue, or open a project from the sidebar.</p>
          </div>
        ) : (
          <div className="recent-issues-list">
            {issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                className="recent-issue-row"
                onClick={() => onIssueClick(issue)}
              >
                <span className="recent-issue-key">{formatKey(issue)}</span>
                <span className="recent-issue-summary">{issue.summary}</span>
                {issue.project && (
                  <span className="recent-issue-project">
                    {issue.project.name || issue.project.key}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default RecentIssuesView;
