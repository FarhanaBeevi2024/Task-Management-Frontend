import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardNavBar, { DASHBOARD_VIEWS } from '../components/DashboardNavBar.jsx';
import ProjectsView from '../components/ProjectsView.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import TaskBoardView from '../components/TaskBoardView.jsx';
import ProjectOverview from '../components/ProjectOverview.jsx';
import IssueForm from '../components/IssueForm.jsx';
import IssueDetail from '../components/IssueDetail.jsx';
import UserManagement from '../components/UserManagement.jsx';
import WorkItemsView from '../components/WorkItemsView.jsx';
import { canUserCreateProject } from '../config/accessConfig.js';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [allIssues, setAllIssues] = useState([]);
  const [mainView, setMainView] = useState(DASHBOARD_VIEWS.PROJECTS);
  const [parentIssueForSubtask, setParentIssueForSubtask] = useState(null);

  useEffect(() => {
    fetchUserInfo();
    fetchProjects();
  }, [session]);

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

  const hasProjectSelected = Boolean(selectedProject);
  const allowCreateProject = canUserCreateProject(userRole);

  const handleNavViewChange = (view) => {
    setMainView(view);
    if (view === DASHBOARD_VIEWS.PROJECTS) setSelectedProject(null);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setMainView(DASHBOARD_VIEWS.PROJECTS);
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setMainView(DASHBOARD_VIEWS.OVERVIEW);
  };

  return (
    <div className="jira-dashboard-container">
      <DashboardNavBar
        currentUser={currentUser}
        mainView={mainView}
        onViewChange={handleNavViewChange}
        onLogout={onLogout}
        userRole={userRole}
        selectedProject={selectedProject}
        onBackToProjects={handleBackToProjects}
      />

      <main className="dashboard-main">
        {mainView === DASHBOARD_VIEWS.USER_MANAGEMENT ? (
          <UserManagement session={session} />
        ) : hasProjectSelected && mainView === DASHBOARD_VIEWS.WORK_ITEMS ? (
          <WorkItemsView
            session={session}
            currentUser={currentUser}
            onIssueClick={handleRecentIssueClick}
            project={selectedProject}
          />
        ) : hasProjectSelected && mainView === DASHBOARD_VIEWS.OVERVIEW ? (
          <div className="dashboard-main-content">
            <ProjectOverview
              project={selectedProject}
              session={session}
              userRole={userRole}
            />
          </div>
        ) : hasProjectSelected && mainView === DASHBOARD_VIEWS.BOARD ? (
          <TaskBoardView
            project={selectedProject}
            session={session}
            onBackToProjects={handleBackToProjects}
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
        ) : mainView === DASHBOARD_VIEWS.PROJECT_UPDATES ? (
          <ProjectsView
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateProjectClick={() => setShowProjectForm(true)}
            title="Project updates"
            showCreateButton={false}
          />
        ) : (
          <ProjectsView
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateProjectClick={() => setShowProjectForm(true)}
            title="Projects"
            showCreateButton={allowCreateProject}
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
