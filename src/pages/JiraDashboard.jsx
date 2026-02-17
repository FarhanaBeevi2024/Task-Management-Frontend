import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProjectCard from '../components/ProjectCard.jsx';
import JiraBoard from './JiraBoard.jsx';
import IssueForm from '../components/IssueForm.jsx';
import IssueDetail from '../components/IssueDetail.jsx';
import './JiraDashboard.css';

const JiraDashboard = ({ session, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showIssueDetail, setShowIssueDetail] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('board');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUserInfo();
    fetchProjects();
  }, [session]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/jira/projects', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      await axios.post('/api/jira/projects', projectData, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setShowProjectForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleCreateIssue = async (issueData) => {
    try {
      await axios.post('/api/jira/issues', {
        ...issueData,
        project_id: selectedProject.id
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setShowIssueForm(false);
      setSelectedIssue(null);
      // Trigger board refresh
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating issue:', error);
      alert(error.response?.data?.error || 'Failed to create');
    }
  };

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
    setShowIssueDetail(true);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Show board view if project is selected
  if (selectedProject) {
    return (
      <div className="jira-dashboard-container">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-user">
            <div className="user-avatar-large">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser?.email?.split('@')[0] || 'User'}</div>
              <div className="user-email">{currentUser?.email}</div>
            </div>
          </div>

          <nav className="sidebar-menu">
            <div className="menu-section">
              <div className="menu-item">
                <span className="menu-icon">📊</span>
                <span>Dashboard</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">📥</span>
                <span>Inbox</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">📅</span>
                <span>Calendar</span>
              </div>
            </div>

            <div className="menu-section">
              <div className="section-title">
                <span>Team spaces</span>
                <span className="add-icon">+</span>
              </div>
              <div className="menu-item active">
                <span className="menu-icon">✓</span>
                <span>Tasks</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">📄</span>
                <span>Docs</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">💬</span>
                <span>Meeting</span>
              </div>
            </div>

            <div className="menu-section">
              <div className="menu-item">
                <span className="menu-icon">⚙️</span>
                <span>Settings</span>
              </div>
              <div className="menu-item">
                <span className="menu-icon">❓</span>
                <span>Support</span>
              </div>
            </div>
          </nav>

          <div className="sidebar-footer">
            <button onClick={onLogout} className="logout-btn-sidebar">
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="main-header">
            <div className="breadcrumbs">
              <span className="breadcrumb-link" onClick={() => setSelectedProject(null)}>
                ← Team spaces
              </span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Tasks</span>
            </div>
            <div className="header-title">
              <h1>Tasks</h1>
              <p>Short description will be placed here</p>
            </div>
            <div className="view-tabs">
              <button 
                className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveView('overview')}
              >
                Overview
              </button>
              <button 
                className={`view-tab ${activeView === 'board' ? 'active' : ''}`}
                onClick={() => setActiveView('board')}
              >
                Board
              </button>
              <button 
                className={`view-tab ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                List
              </button>
              <button 
                className={`view-tab ${activeView === 'table' ? 'active' : ''}`}
                onClick={() => setActiveView('table')}
              >
                Table
              </button>
              <button 
                className={`view-tab ${activeView === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveView('timeline')}
              >
                Timeline
              </button>
            </div>
          </div>

          <div className="board-container">
            <JiraBoard
              key={refreshKey}
              project={selectedProject}
              session={session}
              onIssueClick={handleIssueClick}
            />
          </div>

          <button
            className="create-issue-fab"
            onClick={() => {
              setSelectedIssue(null);
              setShowIssueForm(true);
            }}
            title="Create"
          >
            +
          </button>
        </main>

        {/* Issue Detail Modal */}
        {showIssueDetail && selectedIssue && (
          <IssueDetail
            issue={selectedIssue}
            session={session}
            onClose={() => {
              setShowIssueDetail(false);
              setSelectedIssue(null);
            }}
            onEdit={() => {
              setShowIssueDetail(false);
              setShowIssueForm(true);
            }}
          />
        )}

        {/* Issue Form Modal */}
        {showIssueForm && (
          <IssueForm
            project={selectedProject}
            issue={selectedIssue}
            session={session}
            onSubmit={handleCreateIssue}
            onCancel={() => {
              setShowIssueForm(false);
              setSelectedIssue(null);
            }}
          />
        )}
      </div>
    );
  }

  // Show projects list with sidebar
  return (
    <div className="jira-dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-user">
          <div className="user-avatar-large">
            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{currentUser?.email?.split('@')[0] || 'User'}</div>
            <div className="user-email">{currentUser?.email}</div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-section">
            <div className="menu-item active">
              <span className="menu-icon">📊</span>
              <span>Dashboard</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">📥</span>
              <span>Inbox</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">📅</span>
              <span>Calendar</span>
            </div>
          </div>

          <div className="menu-section">
            <div className="section-title">
              <span>Team spaces</span>
              <span className="add-icon">+</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">✓</span>
              <span>Tasks</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">📄</span>
              <span>Docs</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">💬</span>
              <span>Meeting</span>
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-item">
              <span className="menu-icon">⚙️</span>
              <span>Settings</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">❓</span>
              <span>Support</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn-sidebar">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Projects</h1>
            <p>Select a project to view its board</p>
          </div>
          <button
            onClick={() => setShowProjectForm(true)}
            className="create-project-btn"
          >
            + Create Project
          </button>
        </div>

        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started!</p>
            </div>
          ) : (
            projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))
          )}
        </div>

        {showProjectForm && (
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setShowProjectForm(false)}
          />
        )}
      </main>
    </div>
  );
};

// Simple Project Form Component
const ProjectForm = ({ onSubmit, onCancel }) => {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ key, name, description });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Key *</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              required
              placeholder="e.g., PROJ"
              maxLength={10}
            />
          </div>
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter project name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JiraDashboard;
