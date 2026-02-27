import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
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
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [users, setUsers] = useState([]);
  const [canAssignTasks, setCanAssignTasks] = useState(false);
  const [draggedIssueId, setDraggedIssueId] = useState(null);
  const [toast, setToast] = useState(null);

  const statuses = [
    { key: 'to_do', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'in_review', label: 'In Review' },
    { key: 'done', label: 'Completed' }
  ];

  const showToast = (message, type = 'info', duration = 2500) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => {
        setToast(null);
      }, duration);
    }
  };

  useEffect(() => {
    if (project) {
      fetchIssues();
      fetchSprints();
      fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setUsers(response.data || []);
      setCanAssignTasks(true);
    } catch (error) {
      // If not allowed (403), just skip assignment dropdown
      if (error?.response?.status !== 403) {
        console.error('Error fetching users for assignment:', error);
      }
      setCanAssignTasks(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      showToast('Updating task status...', 'info', 1500);
      await axios.put(`/api/jira/issues/${issueId}`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      fetchIssues();
      showToast('Task status updated', 'success');
    } catch (error) {
      console.error('Error updating issue status:', error);
      showToast('Failed to update task status', 'error');
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

  const handleAssign = async (issueId, userId) => {
    try {
      showToast('Assigning task...', 'info', 1500);
      await axios.put(
        `/api/jira/issues/${issueId}`,
        { assignee_id: userId },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      fetchIssues();
      showToast('Task assignee updated', 'success');
    } catch (error) {
      console.error('Error assigning issue:', error);
      showToast(error.response?.data?.error || 'Failed to assign issue', 'error');
    }
  };

  const handleDragStart = (issueId) => {
    setDraggedIssueId(issueId);
  };

  const handleDropOnColumn = async (statusKey) => {
    if (!draggedIssueId) return;
    await handleStatusChange(draggedIssueId, statusKey);
    setDraggedIssueId(null);
  };

  const handleExportExcel = () => {
    const rows = filteredIssues.map((issue) => ({
      'Issue Key': issue.issue_key,
      Summary: issue.summary,
      Description: issue.description,
      Status: STATUS_LABELS[issue.status] || issue.status,
      'Internal Priority': issue.internal_priority || '',
      'Client Priority': issue.client_priority || '',
      Assignee: issue.assignee?.email || '',
      'Planned (days)': issue.estimated_days ?? '',
      'Actual (days)': issue.actual_days ?? '',
      'Exposed to client': issue.exposed_to_client ? 'Yes' : 'No',
      Created: issue.created_at ? new Date(issue.created_at).toLocaleString() : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

    const filename = `tasks_${project?.key || 'project'}.xlsx`;
    XLSX.writeFile(workbook, filename);
    setShowExportConfirm(false);
  };

  // Only show full-page loading state before we have any issues.
  if (loading && issues.length === 0) {
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
        <button
          type="button"
          className="board-export-btn"
          onClick={() => setShowExportConfirm(true)}
        >
          ⬆️ Export
        </button>
      </div>
      <div className="board-columns">
        {statuses.map(status => {
          const statusIssues = getIssuesByStatus(status.key);
          return (
            <div
              key={status.key}
              className="board-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnColumn(status.key);
              }}
            >
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
                    users={users}
                    onAssign={canAssignTasks ? handleAssign : null}
                    onDragStart={handleDragStart}
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
      {toast && (
        <div className={`board-toast board-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
      {showExportConfirm && (
        <div className="board-report-overlay" onClick={() => setShowExportConfirm(false)}>
          <div className="board-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="board-report-header">
              <h2>Confirm export</h2>
              <button
                type="button"
                className="board-report-close"
                onClick={() => setShowExportConfirm(false)}
                aria-label="Close export preview"
              >
                ×
              </button>
            </div>
            <p className="board-report-subtitle">
              Exporting {filteredIssues.length} task{filteredIssues.length === 1 ? '' : 's'} for project {project?.key || ''}{' '}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '0 1.5rem 1.25rem 1.5rem' }}>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowExportConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={handleExportExcel}
              >
                Confirm export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JiraBoard;

