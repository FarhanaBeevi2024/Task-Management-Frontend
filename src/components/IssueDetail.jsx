import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IssueDetail.css';

const IssueDetail = ({ issue, session, onClose, onEdit }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [issue]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/jira/issues/${issue.id}/comments`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await axios.post(`/api/jira/issues/${issue.id}/comments`, {
        body: newComment
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const statusConfig = {
    to_do: { color: '#6b7280', bg: '#f3f4f6', label: 'To Do' },
    in_progress: { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
    in_review: { color: '#f59e0b', bg: '#fef3c7', label: 'In Review' },
    done: { color: '#10b981', bg: '#d1fae5', label: 'Completed' }
  };

  const priorityConfig = {
    lowest: { color: '#9ca3af', label: 'Lowest' },
    low: { color: '#6b7280', label: 'Low' },
    medium: { color: '#f59e0b', label: 'Medium' },
    high: { color: '#f97316', label: 'High' },
    highest: { color: '#ef4444', label: 'Highest' }
  };

  const status = statusConfig[issue.status] || statusConfig.to_do;
  const priority = priorityConfig[issue.priority] || priorityConfig.medium;
  const issueType = issue.issue_type || {};

  return (
    <div className="issue-detail-overlay" onClick={onClose}>
      <div className="issue-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-header-left">
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="detail-header-right">
            <button className="icon-btn" title="Time">🕐</button>
            <button className="icon-btn" title="Star">⭐</button>
            <button className="icon-btn" title="More">⋯</button>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-title-section">
            <h1 className="detail-title">{issue.summary}</h1>
            <div className="detail-key">{issue.issue_key}</div>
          </div>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">Created time:</span>
              <span className="meta-value">
                {new Date(issue.created_at).toLocaleString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span 
                className="status-tag"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                • {status.label}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Priority:</span>
              <span 
                className="priority-tag"
                style={{ color: priority.color }}
              >
                {priority.label}
              </span>
            </div>
            {issue.due_date && (
              <div className="meta-item">
                <span className="meta-label">Due Date:</span>
                <span className="meta-value">
                  {new Date(issue.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {issue.labels && issue.labels.length > 0 && (
              <div className="meta-item">
                <span className="meta-label">Tags:</span>
                <div className="tags-list">
                  {issue.labels.map((label, idx) => (
                    <span key={idx} className="tag">{label}</span>
                  ))}
                </div>
              </div>
            )}
            {issue.assignee && (
              <div className="meta-item">
                <span className="meta-label">Assignees:</span>
                <div className="assignees-list">
                  <div className="assignee-avatar-small">
                    {issue.assignee.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="detail-description">
            <h3>Project Description</h3>
            <p>{issue.description || 'No description provided.'}</p>
          </div>

          <div className="detail-tabs">
            <button className="tab-btn active">Activity</button>
            <button className="tab-btn">My Work</button>
            <button className="tab-btn">Assigned</button>
            <button className="tab-btn">Comments</button>
          </div>

          <div className="detail-activity">
            <div className="activity-section">
              <div className="activity-date">Today</div>
              <div className="activity-item">
                <div className="activity-avatar">
                  {issue.reporter?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{issue.reporter?.email?.split('@')[0] || 'User'}</strong> created {issue.issue_key}
                  </div>
                  <div className="activity-time">
                    {new Date(issue.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="comments-section">
              <h4>Comments ({comments.length})</h4>
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.author?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <strong>{comment.author?.email?.split('@')[0] || 'User'}</strong>
                      <span className="comment-time">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="comment-body">{comment.body}</div>
                  </div>
                </div>
              ))}

              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="3"
                  className="comment-input"
                />
                <button type="submit" className="comment-submit-btn">
                  Add Comment
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;

