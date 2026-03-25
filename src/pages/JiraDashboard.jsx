import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DashboardNavBar, { DASHBOARD_VIEWS } from '../components/DashboardNavBar.jsx';
import ProjectsView from '../components/ProjectsView.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import TaskBoardView from '../components/TaskBoardView.jsx';
import ProjectOverview from '../components/ProjectOverview.jsx';
import IssueForm from '../components/IssueForm.jsx';
import IssueDetail from '../components/IssueDetail.jsx';
import UserManagement from '../components/UserManagement.jsx';
import WorkItemsView from '../components/WorkItemsView.jsx';
import CalendarView from '../components/CalendarView.jsx';
import MilestonesView from '../components/MilestonesView.jsx';
import RolesManagement from '../components/RolesManagement.jsx';
import TopBar from '../components/TopBar.jsx';
import { useAccessConfig } from '../context/AccessConfigContext.jsx';
import { useOrganization } from '../context/OrganizationContext.jsx';
import './JiraDashboard.css';

/**
 * Main dashboard page: projects list, recent issues, or project board.
 * Composes DashboardNavBar, ProjectsView, RecentIssuesView, TaskBoardView, and modals.
 */
function JiraDashboard({ session, onLogout }) {
  const {
    ready: orgReady,
    organizations,
    activeOrganizationId,
    switchOrganization,
  } = useOrganization();
  const {
    canUserCreateProject,
    canCreateIssues,
    canManageProjectMembers,
    canShowMilestonesNav,
  } = useAccessConfig();
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
  const [notifications, setNotifications] = useState([]); // unread
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]); // history
  const [loadingAllNotifications, setLoadingAllNotifications] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  useEffect(() => {
    fetchUserInfo();
    fetchProjects();
  }, [session]);

  useEffect(() => {
    if (selectedProject) {
      fetchAllIssues();
    }
  }, [selectedProject, refreshKey]);

  // Clients (project role) must not see Work items / Calendar: redirect to Board if they land on it
  useEffect(() => {
    if (
      selectedProject?.current_user_project_role === 'client' &&
      (mainView === DASHBOARD_VIEWS.WORK_ITEMS || mainView === DASHBOARD_VIEWS.CALENDAR)
    ) {
      setMainView(DASHBOARD_VIEWS.BOARD);
    }
  }, [selectedProject?.current_user_project_role, mainView]);

  // Hide Milestones for client roles unless Access Control enables canManageMilestones for them
  useEffect(() => {
    if (
      mainView === DASHBOARD_VIEWS.MILESTONES &&
      !canShowMilestonesNav(userRole, selectedProject?.current_user_project_role ?? null)
    ) {
      setMainView(DASHBOARD_VIEWS.BOARD);
    }
  }, [
    mainView,
    userRole,
    selectedProject?.current_user_project_role,
    canShowMilestonesNav,
  ]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/user');
      setCurrentUser(response.data);
      setUserRole(response.data.role ?? 'user');
      await fetchNotifications();
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Fallback: if the backend call fails (often token timing), populate email from session.
      const email = session?.user?.email;
      const id = session?.user?.id;
      if (email || id) {
        setCurrentUser({
          id: id ?? null,
          email: email ?? '',
          role: userRole ?? 'user',
        });
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.get('/api/jira/notifications?status=unread');
      const unread = Array.isArray(response.data) ? response.data : [];
      setNotifications(unread);
      if (unread.length > 0) {
        setShowNotificationsModal(true);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/jira/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllIssues = async () => {
    if (!selectedProject) return;
    try {
      const response = await api.get('/api/jira/issues', {
        params: { project_id: selectedProject.id },
      });
      setAllIssues(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const fetchAllNotifications = async () => {
    try {
      setLoadingAllNotifications(true);
      const response = await api.get('/api/jira/notifications?status=all');
      setAllNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching all notifications:', error);
    } finally {
      setLoadingAllNotifications(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      await api.post('/api/jira/projects', projectData);
      setShowProjectForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.response?.data?.error ?? 'Failed to create project');
    }
  };

  const handleDeleteProject = async (project) => {
    if (!project?.id) return;
    const ok = window.confirm(`Delete project "${project.name}"?\n\nThis will permanently delete the project and its related data.`);
    if (!ok) return;
    try {
      await api.delete(`/api/jira/projects/${project.id}`);
      // If deleting the current project, navigate back
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        setMainView(DASHBOARD_VIEWS.PROJECTS);
      }
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.error ?? 'Failed to delete project');
    }
  };

  const handleCreateIssue = async (issueData) => {
    try {
      await api.post('/api/jira/issues', {
        ...issueData,
        project_id: selectedProject.id,
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

  const handleDismissNotifications = async () => {
    if (!notifications.length) {
      setNotifications([]);
      return;
    }
    const ids = notifications.map((n) => n.id);
    try {
      await api.post(
        '/api/jira/notifications/mark-read',
        { ids }
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    } finally {
      setNotifications([]);
      // Also update local history objects to is_read=true
      if (allNotifications.length) {
        const idSet = new Set(ids);
        setAllNotifications((prev) =>
          prev.map((n) =>
            idSet.has(n.id) ? { ...n, is_read: true } : n
          )
        );
      }
      setShowNotificationsModal(false);
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
  const allowDeleteProject = canManageProjectMembers(userRole);

  const handleNavViewChange = (view) => {
    setMainView(view);
    if (view === DASHBOARD_VIEWS.PROJECTS) setSelectedProject(null);
    if (view === DASHBOARD_VIEWS.NOTIFICATIONS) {
      fetchAllNotifications();
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setMainView(DASHBOARD_VIEWS.PROJECTS);
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    if (!project) {
      setMainView(DASHBOARD_VIEWS.PROJECTS);
      return;
    }
    // Keep current project-related view if possible; otherwise default to Overview.
    const projectViews = new Set([
      DASHBOARD_VIEWS.OVERVIEW,
      DASHBOARD_VIEWS.BOARD,
      DASHBOARD_VIEWS.CALENDAR,
      DASHBOARD_VIEWS.WORK_ITEMS,
      DASHBOARD_VIEWS.MILESTONES,
    ]);
    if (projectViews.has(mainView)) return;
    setMainView(DASHBOARD_VIEWS.OVERVIEW);
  };

  if (!orgReady) {
    return (
      <div className="jira-dashboard-container">
        <div className="dashboard-main-content" style={{ padding: '2rem' }}>
          Loading workspace…
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="jira-dashboard-container">
        <DashboardNavBar
          mainView={mainView}
          onViewChange={handleNavViewChange}
          onLogout={onLogout}
          userRole={userRole}
          selectedProject={selectedProject}
          projectRole={selectedProject?.current_user_project_role ?? null}
          onBackToProjects={handleBackToProjects}
          orgMemberRole={currentUser?.org_member_role ?? null}
        />
        <main className="dashboard-main">
          <TopBar
            currentUser={currentUser}
            onLogout={onLogout}
            notificationsCount={notifications.length}
            onOpenNotifications={() => handleNavViewChange(DASHBOARD_VIEWS.NOTIFICATIONS)}
            notificationsActive={mainView === DASHBOARD_VIEWS.NOTIFICATIONS}
          />
          <div className="dashboard-main-content" style={{ padding: '2rem', maxWidth: '32rem' }}>
            <h2>No organization</h2>
            <p>
              Your account is not linked to an organization yet. Ask a super admin or admin to send
              you an invitation email with a signup link.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="jira-dashboard-container">
      <DashboardNavBar
        mainView={mainView}
        onViewChange={handleNavViewChange}
        onLogout={onLogout}
        userRole={userRole}
        selectedProject={selectedProject}
        projectRole={selectedProject?.current_user_project_role ?? null}
        onBackToProjects={handleBackToProjects}
        orgMemberRole={currentUser?.org_member_role ?? null}
      />

      <main className="dashboard-main">
        <TopBar
          currentUser={currentUser}
          onLogout={onLogout}
          notificationsCount={notifications.length}
          onOpenNotifications={() => handleNavViewChange(DASHBOARD_VIEWS.NOTIFICATIONS)}
          notificationsActive={mainView === DASHBOARD_VIEWS.NOTIFICATIONS}
        />
        {mainView === DASHBOARD_VIEWS.USER_MANAGEMENT ? (
          <UserManagement session={session} />
        ) : mainView === DASHBOARD_VIEWS.ROLES ? (
          <RolesManagement userRole={userRole} />
        ) : mainView === DASHBOARD_VIEWS.NOTIFICATIONS ? (
          <div className="dashboard-main-content">
            <div className="notifications-page-header">
              <h1>Notifications</h1>
              <div className="notifications-page-actions">
                <button
                  type="button"
                  className="notifications-secondary-btn"
                  onClick={fetchAllNotifications}
                  disabled={loadingAllNotifications}
                >
                  {loadingAllNotifications ? 'Refreshing...' : 'Refresh'}
                </button>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="notifications-primary-btn"
                    onClick={handleDismissNotifications}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
            {allNotifications.length === 0 ? (
              <div className="notifications-empty">
                <p>You are all caught up. No new task notifications.</p>
              </div>
            ) : (
              <ul className="notifications-list-page">
                {allNotifications.map((n) => (
                  <li key={n.id} className={`notifications-list-item ${n.is_read ? 'is-read' : ''}`}>
                    <div className="notifications-list-item-icon">
                      {n.is_read ? '✓' : '•'}
                    </div>
                    <div className="notifications-list-item-content">
                      <p className="notifications-list-item-text">{n.message}</p>
                      {n.created_at && (
                        <p className="notifications-list-item-meta">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : hasProjectSelected && mainView === DASHBOARD_VIEWS.CALENDAR ? (
          <div className="dashboard-main-content dashboard-main-content--calendar">
            <CalendarView project={selectedProject} issues={allIssues} />
          </div>
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
        ) : hasProjectSelected && mainView === DASHBOARD_VIEWS.MILESTONES ? (
          <div className="dashboard-main-content">
            <MilestonesView
              project={selectedProject}
              session={session}
              userRole={userRole}
            />
          </div>
        ) : hasProjectSelected && mainView === DASHBOARD_VIEWS.BOARD ? (
          <TaskBoardView
            project={selectedProject}
            session={session}
            userRole={userRole}
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
            onDeleteProject={allowDeleteProject ? handleDeleteProject : undefined}
            onCreateProjectClick={() => setShowProjectForm(true)}
            title="Project updates"
            showCreateButton={false}
          />
        ) : (
          <ProjectsView
            projects={projects}
            onSelectProject={handleSelectProject}
            onDeleteProject={allowDeleteProject ? handleDeleteProject : undefined}
            onCreateProjectClick={() => setShowProjectForm(true)}
            title="Projects"
            showCreateButton={allowCreateProject}
          />
        )}
      </main>

      {showProjectForm && (
        <ProjectForm
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
          onAddSubtask={
            selectedProject && canCreateIssues(userRole) ? handleAddSubtask : undefined
          }
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

      {showNotificationsModal && notifications.length > 0 && (
        <div className="notifications-modal-overlay">
          <div className="notifications-modal">
            <div className="notifications-modal-header">
              <h2>New task assignment{notifications.length > 1 ? 's' : ''}</h2>
              <button
                type="button"
                className="notifications-modal-close"
                onClick={handleDismissNotifications}
                aria-label="Dismiss notifications"
              >
                ×
              </button>
            </div>
            <p className="notifications-modal-subtitle">
              You have {notifications.length} new task
              {notifications.length > 1 ? 's' : ''} assigned to you.
            </p>
            <ul className="notifications-modal-list">
              {notifications.map((n) => (
                <li key={n.id} className="notifications-modal-item">
                  {n.message}
                </li>
              ))}
            </ul>
            <div className="notifications-modal-actions">
              <button
                type="button"
                className="notifications-secondary-btn"
                onClick={() => setShowNotificationsModal(false)}
              >
                Remind me later
              </button>
              <button
                type="button"
                className="notifications-primary-btn"
                onClick={handleDismissNotifications}
              >
                Mark as read
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JiraDashboard;
