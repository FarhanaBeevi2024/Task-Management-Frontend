import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IssueCard from '../components/IssueCard.jsx';
import './JiraBoard.css';

const JiraBoard = ({ project, session, onIssueClick }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sprint, setSprint] = useState(null);
  const [sprints, setSprints] = useState([]);

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

  const getIssuesByStatus = (status) => {
    return issues.filter(issue => issue.status === status);
  };

  if (loading) {
    return <div className="board-loading">Loading board...</div>;
  }

  return (
    <div className="jira-board">
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
    </div>
  );
};

export default JiraBoard;

