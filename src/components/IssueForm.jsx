import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IssueForm.css';

const IssueForm = ({ project, issue, parentIssue, session, onSubmit, onCancel, userRole, issues = [] }) => {
  const [issueTypes, setIssueTypes] = useState([]);
  const [releases, setReleases] = useState([]);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [issueTypeId, setIssueTypeId] = useState('');
  const [internalPriority, setInternalPriority] = useState('P3');
  const [clientPriority, setClientPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [releaseId, setReleaseId] = useState('');
  const [parentIssueId, setParentIssueId] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [labels, setLabels] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [actualDays, setActualDays] = useState('');
  const [exposedToClient, setExposedToClient] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchIssueTypes();
    fetchReleases();
    if (parentIssue) {
      setParentIssueId(parentIssue.id || '');
    }
    if (issue) {
      setSummary(issue.summary || '');
      setDescription(issue.description || '');
      setIssueTypeId(issue.issue_type_id || '');
      const oldPriority = issue.internal_priority || issue.priority || 'medium';
      const priorityMap = {
        'highest': 'P1', 'high': 'P2', 'medium': 'P3', 'low': 'P4', 'lowest': 'P5'
      };
      setInternalPriority(priorityMap[oldPriority] || oldPriority || 'P3');
      const oldClientPriority = issue.client_priority || '';
      setClientPriority(oldClientPriority ? (priorityMap[oldClientPriority] || oldClientPriority) : '');
      setAssigneeId(issue.assignee_id || '');
      setReleaseId(issue.release_id || '');
      setParentIssueId(issue.parent_issue_id || parentIssue?.id || '');
      setStoryPoints(issue.story_points || '');
      setLabels(issue.labels?.join(', ') || '');
      setEstimatedDays(issue.estimated_days ?? '');
      setActualDays(issue.actual_days ?? '');
      setExposedToClient(issue.exposed_to_client === true);
    } else if (parentIssue) {
      setParentIssueId(parentIssue.id || '');
    }
  }, [issue, parentIssue, project]);

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

  const fetchReleases = async () => {
    if (!project) return;
    try {
      const response = await axios.get('/api/jira/releases', {
        params: { project_id: project.id, is_active: true },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setReleases(response.data);
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setTeamMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      issue_type_id: issueTypeId,
      summary,
      description,
      internal_priority: internalPriority,
      client_priority: clientPriority || null,
      assignee_id: assigneeId || null,
      release_id: releaseId || null,
      parent_issue_id: parentIssueId || null,
      story_points: storyPoints ? parseInt(storyPoints) : null,
      labels: labels ? labels.split(',').map(l => l.trim()).filter(l => l) : [],
      estimated_days: estimatedDays === '' ? null : parseInt(estimatedDays, 10),
      actual_days: actualDays === '' ? null : parseInt(actualDays, 10),
      exposed_to_client: exposedToClient
    });
  };

  const parentIssueOptions = issues.filter(i => i.id !== issue?.id && !i.parent_issue_id);
  const isSubtaskForm = Boolean(parentIssue);
  const isTeamLeader = userRole === 'team_leader';
  const canAssign = isTeamLeader;
  // Fetch team members when canAssign - need session for dependency
  useEffect(() => {
    if (canAssign && session) fetchTeamMembers();
  }, [canAssign, session]);
  const fieldsEditable = true;

  return (
    <div className="issue-form-overlay">
      <div className="issue-form-modal">
        <h2>{issue ? 'Edit Issue' : isSubtaskForm ? 'Add subtask' : 'Create Issue'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Issue Type *</label>
              <select
                value={issueTypeId}
                onChange={(e) => setIssueTypeId(e.target.value)}
                required
                disabled={!fieldsEditable}
              >
                {issueTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Internal Priority</label>
              <select 
                value={internalPriority} 
                onChange={(e) => setInternalPriority(e.target.value)}
                disabled={!fieldsEditable}
              >
                <option value="P1">P1 - Highest</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
                <option value="P5">P5 - Lowest</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="exposed-to-client-form" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0, paddingTop: '0.125rem' }}>
                <input
                  type="checkbox"
                  id="exposed-to-client-form"
                  checked={exposedToClient}
                  onChange={(e) => setExposedToClient(e.target.checked)}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>Exposed to client</span>
              </label>
            </div>
            <div className="form-group">
              <label>Client Priority</label>
              <select 
                value={clientPriority} 
                onChange={(e) => setClientPriority(e.target.value)}
                disabled={!fieldsEditable}
              >
                <option value="">Not Set</option>
                <option value="P1">P1 - Highest</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
                <option value="P5">P5 - Lowest</option>
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
              disabled={!fieldsEditable}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter issue description"
              rows="6"
              disabled={!fieldsEditable}
            />
          </div>

          <div className="form-row">
            {canAssign && (
              <div className="form-group">
                <label>Assign To</label>
                <select 
                  value={assigneeId} 
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={!fieldsEditable}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.email} {u.role && `(${u.role})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {releases.length > 0 && (
              <div className="form-group">
                <label>Release / Milestone</label>
                <select 
                  value={releaseId} 
                  onChange={(e) => setReleaseId(e.target.value)}
                  disabled={!fieldsEditable}
                >
                  <option value="">No Release</option>
                  {releases.map(release => (
                    <option key={release.id} value={release.id}>
                      {release.name} {release.version && `(${release.version})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isSubtaskForm && (
            <div className="form-group">
              <label>Parent issue</label>
              <div className="form-readonly">{parentIssue?.issue_key} – {parentIssue?.summary}</div>
            </div>
          )}
          {!isSubtaskForm && parentIssueOptions.length > 0 && (
            <div className="form-group">
              <label>Parent Issue (for subtasks)</label>
              <select 
                value={parentIssueId} 
                onChange={(e) => setParentIssueId(e.target.value)}
                disabled={!fieldsEditable}
              >
                <option value="">None (Top-level issue)</option>
                {parentIssueOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.issue_key} - {opt.summary}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                disabled={!fieldsEditable}
              />
            </div>
            <div className="form-group">
              <label>Labels</label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="comma-separated labels"
                disabled={!fieldsEditable}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Planned (days/hours)</label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="Days to complete"
                min="0"
                max="365"
                disabled={!fieldsEditable}
              />
            </div>
            <div className="form-group">
              <label>Actual (days/hours taken)</label>
              <input
                type="number"
                value={actualDays}
                onChange={(e) => setActualDays(e.target.value)}
                placeholder="Days taken"
                min="0"
                max="365"
                disabled={!fieldsEditable}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {issue ? 'Update' : isSubtaskForm ? 'Add subtask' : 'Create'} Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;
