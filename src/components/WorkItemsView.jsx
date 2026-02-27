import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './WorkItemsView.css';

function WorkItemsView({ session, currentUser, onIssueClick, project }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('assigned_to_me');

  useEffect(() => {
    if (!currentUser?.id || !project?.id) return;
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, project?.id, filter]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = { project_id: project.id };
      if (filter === 'assigned_to_me') {
        params.assignee_id = currentUser.id;
      }
      const response = await axios.get('/api/jira/issues', {
        params,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setIssues(response.data ?? []);
    } catch (error) {
      console.error('Error fetching work items:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="work-items">
      <div className="work-items-header">
        <div>
          <h1>Work items</h1>
          <p>Tasks and issues assigned to you.</p>
        </div>
        <div className="work-items-filters">
          <label htmlFor="work-items-filter">View</label>
          <select
            id="work-items-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="assigned_to_me">Assigned to me</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="work-items-loading">Loading work items...</div>
      ) : issues.length === 0 ? (
        <div className="work-items-empty">
          <h3>No work items</h3>
          <p>You have no tasks assigned with this filter.</p>
        </div>
      ) : (
        <div className="work-items-table-wrapper">
          <table className="work-items-table">
            <thead>
              <tr>
                <th>Issue key</th>
                <th>Summary</th>
                <th>Project</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Due date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  onClick={() => onIssueClick && onIssueClick(issue)}
                  className="work-items-row"
                >
                  <td>{issue.issue_key}</td>
                  <td>{issue.summary}</td>
                  <td>{issue.project?.key || ''}</td>
                  <td>{issue.status}</td>
                  <td>{issue.assignee?.email || ''}</td>
                  <td>{issue.due_date ? new Date(issue.due_date).toLocaleDateString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WorkItemsView;

