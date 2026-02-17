import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IssueForm.css';

const IssueForm = ({ project, issue, session, onSubmit, onCancel }) => {
  const [issueTypes, setIssueTypes] = useState([]);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [issueTypeId, setIssueTypeId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [labels, setLabels] = useState('');

  useEffect(() => {
    fetchIssueTypes();
    if (issue) {
      setSummary(issue.summary || '');
      setDescription(issue.description || '');
      setIssueTypeId(issue.issue_type_id || '');
      setPriority(issue.priority || 'medium');
      setAssigneeId(issue.assignee_id || '');
      setStoryPoints(issue.story_points || '');
      setLabels(issue.labels?.join(', ') || '');
    }
  }, [issue]);

  const fetchIssueTypes = async () => {
    try {
      const response = await axios.get('/api/jira/issue-types', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setIssueTypes(response.data);
      if (response.data.length > 0 && !issue) {
        setIssueTypeId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching issue types:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      issue_type_id: issueTypeId,
      summary,
      description,
      priority,
      assignee_id: assigneeId || null,
      story_points: storyPoints ? parseInt(storyPoints) : null,
      labels: labels ? labels.split(',').map(l => l.trim()).filter(l => l) : []
    });
  };

  return (
    <div className="issue-form-overlay">
      <div className="issue-form-modal">
        <h2>{issue ? 'Edit' : 'Create'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Issue Type *</label>
              <select
                value={issueTypeId}
                onChange={(e) => setIssueTypeId(e.target.value)}
                required
              >
                {issueTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="lowest">Lowest</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="highest">Highest</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Summary *</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              placeholder="Enter issue summary"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter issue description"
              rows="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Story Points</label>
              <input
                type="number"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="e.g., 3"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Labels</label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="comma-separated labels"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {issue ? 'Update' : 'Create'} Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;

