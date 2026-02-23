import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardNavBar, { DASHBOARD_VIEWS } from '../components/DashboardNavBar.jsx';
import ProjectsView from '../components/ProjectsView.jsx';
import RecentIssuesView from '../components/RecentIssuesView.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import TaskBoardView from '../components/TaskBoardView.jsx';
import IssueForm from '../components/IssueForm.jsx';
import IssueDetail from '../components/IssueDetail.jsx';
import './JiraDashboard.css';

/**
 * Main dashboard page: projects list, recent issues, or project board.
 * Composes DashboardNavBar, ProjectsView, RecentIssuesView, TaskBoardView, and modals.
 */
function JiraDashboard({ session, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showIssueDetail, setShowIssueDetail] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('board');
  const [refreshKey, setRefreshKey] = useState(0);
  const [allIssues, setAllIssues] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [mainView, setMainView] = useState(DASHBOARD_VIEWS.PROJECTS);
  const [parentIssueForSubtask, setParentIssueForSubtask] = useState(null);

  useEffect(() => {
    fetchUserInfo();
    fetchProjects();
  }, [session]);

  useEffect(() => {
    if (session && mainView === DASHBOARD_VIEWS.RECENT_ISSUES) {
      fetchRecentIssues();
    }
  }, [session, mainView, refreshKey]);

  useEffect(() => {
    if (selectedProject) {
      fetchAllIssues();
    }
  }, [selectedProject, refreshKey]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/api/user', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setCurrentUser(response.data);
      setUserRole(response.data.role ?? 'user');
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/jira/projects', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setProjects(response.data ?? []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentIssues = async () => {
    try {
      const response = await axios.get('/api/jira/issues', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setRecentIssues(response.data ?? []);
    } catch (error) {
      console.error('Error fetching recent issues:', error);
      setRecentIssues([]);
    }
  };

  const fetchAllIssues = async () => {
    if (!selectedProject) return;
    try {
      const response = await axios.get('/api/jira/issues', {
        params: { project_id: selectedProject.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setAllIssues(response.data ?? []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      await axios.post('/api/jira/projects', projectData, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setShowProjectForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.response?.data?.error ?? 'Failed to create project');
    }
  };

  const handleCreateIssue = async (issueData) => {
    try {
      await axios.post('/api/jira/issues', {
        ...issueData,
        project_id: selectedProject.id,
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setShowIssueForm(false);
      setSelectedIssue(null);
      setParentIssueForSubtask(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Error creating issue:', error);
      alert(error.response?.data?.error ?? 'Failed to create');
    }
  };

  const handleAddSubtask = (parentIssue) => {
    setParentIssueForSubtask(parentIssue);
    setShowIssueDetail(false);
    setShowIssueForm(true);
  };

  const handleRecentIssueClick = (issue) => {
    if (issue.project) {
      setSelectedProject(issue.project);
      setSelectedIssue(issue);
      setShowIssueDetail(true);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  const isBoardView = Boolean(selectedProject);

  const handleNavViewChange = (view) => {
    setMainView(view);
    if (isBoardView) setSelectedProject(null);
  };

  return (
    <div className="jira-dashboard-container">
      <DashboardNavBar
        currentUser={currentUser}
        mainView={mainView}
        onViewChange={handleNavViewChange}
        onLogout={onLogout}
        userRole={userRole}
      />

      <main className="dashboard-main">
        {isBoardView ? (
          <TaskBoardView
            project={selectedProject}
            session={session}
            activeView={activeView}
            onViewChange={setActiveView}
            onBackToProjects={() => setSelectedProject(null)}
            onIssueClick={(issue) => {
              setSelectedIssue(issue);
              setShowIssueDetail(true);
            }}
            onCreateIssueClick={() => {
              setSelectedIssue(null);
              setShowIssueForm(true);
            }}
            boardRefreshKey={refreshKey}
          />
        ) : mainView === DASHBOARD_VIEWS.RECENT_ISSUES ? (
          <RecentIssuesView
            issues={recentIssues}
            onIssueClick={handleRecentIssueClick}
          />
        ) : mainView === DASHBOARD_VIEWS.PROJECT_UPDATES ? (
          <ProjectsView
            projects={projects}
            onSelectProject={setSelectedProject}
            onCreateProjectClick={() => setShowProjectForm(true)}
            title="Project updates"
            showCreateButton={false}
          />
        ) : (
          <ProjectsView
            projects={projects}
            onSelectProject={setSelectedProject}
            onCreateProjectClick={() => setShowProjectForm(true)}
            title="Projects"
          />
        )}
      </main>

      {showProjectForm && (
        <ProjectForm
          session={session}
          onSubmit={handleCreateProject}
          onCancel={() => setShowProjectForm(false)}
        />
      )}

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
          onUpdate={(updatedIssue) => {
            setSelectedIssue(updatedIssue);
            setRefreshKey((k) => k + 1);
          }}
          onAddSubtask={selectedProject ? handleAddSubtask : undefined}
          userRole={userRole}
        />
      )}

      {showIssueForm && selectedProject && (
        <IssueForm
          project={selectedProject}
          issue={parentIssueForSubtask ? null : selectedIssue}
          parentIssue={parentIssueForSubtask}
          session={session}
          userRole={userRole}
          issues={allIssues}
          onSubmit={handleCreateIssue}
          onCancel={() => {
            setShowIssueForm(false);
            setSelectedIssue(null);
            setParentIssueForSubtask(null);
          }}
        />
      )}
    </div>
  );
}

export default JiraDashboard;
