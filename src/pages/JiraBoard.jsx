import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IssueCard from '../components/IssueCard.jsx';
import './JiraBoard.css';

const STATUS_LABELS = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Completed'
};

const JiraBoard = ({ project, session, onIssueClick }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sprint, setSprint] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReport, setShowReport] = useState(false);

  const statuses = [
    { key: 'to_do', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'in_review', label: 'In Review' },
    { key: 'done', label: 'Completed' }
  ];

  useEffect(() => {
    if (project) {
      fetchIssues();
      fetchSprints();
    }
  }, [project, sprint]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = { project_id: project.id };
      if (sprint) params.sprint_id = sprint.id;
      
      const response = await axios.get('/api/jira/issues', {
        params,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async () => {
    try {
      const response = await axios.get('/api/jira/sprints', {
        params: { project_id: project.id, state: 'active' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (response.data.length > 0) {
        setSprint(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await axios.put(`/api/jira/issues/${issueId}`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      fetchIssues();
    } catch (error) {
      console.error('Error updating issue status:', error);
      alert('Failed to update issue status');
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const matchStatus = statusFilter === 'all' || issue.status === statusFilter;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchSearch = !q || (issue.summary || '').toLowerCase().includes(q) || (issue.description || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const getIssuesByStatus = (status) => {
    return filteredIssues.filter(issue => issue.status === status);
  };

  if (loading) {
    return <div className="board-loading">Loading board...</div>;
  }

  return (
    <div className="jira-board">
      <div className="board-toolbar">
        <div className="board-filters">
          <select
            className="board-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Completed</option>
          </select>
          <input
            type="text"
            className="board-search-input"
            placeholder="Search summary or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
        <button type="button" className="board-export-btn" onClick={() => setShowReport(true)}>
          View Excel report
        </button>
      </div>
      <div className="board-columns">
        {statuses.map(status => {
          const statusIssues = getIssuesByStatus(status.key);
          return (
            <div key={status.key} className="board-column">
              <div className="column-header">
                <h3>{status.label}</h3>
                <span className="issue-count">{statusIssues.length}</span>
              </div>
              <div className="column-content">
                {statusIssues.map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onClick={() => onIssueClick && onIssueClick(issue)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {statusIssues.length === 0 && (
                  <div className="empty-column">No issues</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showReport && (
        <div className="board-report-overlay" onClick={() => setShowReport(false)}>
          <div className="board-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="board-report-header">
              <h2>Tasks Excel report</h2>
              <button
                type="button"
                className="board-report-close"
                onClick={() => setShowReport(false)}
                aria-label="Close report"
              >
                ×
              </button>
            </div>
            <p className="board-report-subtitle">
              Showing {filteredIssues.length} task{filteredIssues.length === 1 ? '' : 's'} for project {project?.key || ''}{' '}
              {statusFilter !== 'all' && `with status ${STATUS_LABELS[statusFilter] || statusFilter}`}.
            </p>
            <div className="board-report-table-wrapper">
              <table className="board-report-table">
                <thead>
                  <tr>
                    <th>Issue Key</th>
                    <th>Summary</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Internal Priority</th>
                    <th>Client Priority</th>
                    <th>Assignee</th>
                    <th>Planned (days)</th>
                    <th>Actual (days)</th>
                    <th>Exposed to client</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.issue_key}</td>
                      <td>{issue.summary}</td>
                      <td>{issue.description}</td>
                      <td>{STATUS_LABELS[issue.status] || issue.status}</td>
                      <td>{issue.internal_priority || ''}</td>
                      <td>{issue.client_priority || ''}</td>
                      <td>{issue.assignee?.email || ''}</td>
                      <td>{issue.estimated_days ?? ''}</td>
                      <td>{issue.actual_days ?? ''}</td>
                      <td>{issue.exposed_to_client ? 'Yes' : 'No'}</td>
                      <td>{issue.created_at ? new Date(issue.created_at).toLocaleString() : ''}</td>
                    </tr>
                  ))}
                  {filteredIssues.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                        No tasks match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JiraBoard;

