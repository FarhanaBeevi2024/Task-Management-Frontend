import React from 'react';
import { useAccessConfig } from '../context/AccessConfigContext.jsx';
import './DashboardNavBar.css';

const VIEWS = {
  PROJECTS: 'projects',
  OVERVIEW: 'overview',
  BOARD: 'board',
  CALENDAR: 'calendar',
  WORK_ITEMS: 'work-items',
  MILESTONES: 'milestones',
  NOTIFICATIONS: 'notifications',
  USER_MANAGEMENT: 'user-management',
  ROLES: 'roles',
  PROJECT_UPDATES: 'project-updates',
};

/**
 * Sidebar navigation. When a project is selected: current project (click = back to list), Overview, Board.
 * When no project: Projects, Recent issues, etc.
 */
function DashboardNavBar({ currentUser, mainView, onViewChange, onLogout, userRole, selectedProject, onBackToProjects, projectRole, notificationsCount = 0 }) {
  const { canManageUsers, canShowMilestonesNav } = useAccessConfig();
  const isProjectRoleClient = projectRole === 'client';
  const showUserManagement = canManageUsers(userRole);
  const showRoles = canManageUsers(userRole);
  const displayName = currentUser?.email?.split('@')[0] || 'User';
  const initial = currentUser?.email?.charAt(0).toUpperCase() || 'U';

  const handleNavClick = (view) => {
    if (onViewChange) onViewChange(view);
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-user">
        <div className="user-avatar-large">{initial}</div>
        <div className="user-info">
          <div className="user-name">{displayName}</div>
          <div className="user-email">{currentUser?.email ?? ''}</div>
        </div>
      </div>

      {selectedProject && (
        <button
          type="button"
          className="sidebar-current-project"
          onClick={onBackToProjects}
          title="Back to projects list"
        >
          <div className="current-project-info">
            <span className="current-project-key">{selectedProject.key}</span>
            <span className="current-project-name">{selectedProject.name}</span>
          </div>
        </button>
      )}

      <nav className="sidebar-menu">
        <div className="menu-section">
          {!selectedProject && (
            <>
              <button
                type="button"
                className={`menu-item ${mainView === VIEWS.PROJECTS ? 'active' : ''}`}
                onClick={() => handleNavClick(VIEWS.PROJECTS)}
              >
                <span className="menu-icon">📊</span>
                <span>Projects</span>
              </button>
            </>
          )}
          {selectedProject && (
            <>
              <button
                type="button"
                className={`menu-item ${mainView === VIEWS.OVERVIEW ? 'active' : ''}`}
                onClick={() => handleNavClick(VIEWS.OVERVIEW)}
              >
                <span className="menu-icon">📄</span>
                <span>Overview</span>
              </button>
              <button
                type="button"
                className={`menu-item ${mainView === VIEWS.BOARD ? 'active' : ''}`}
                onClick={() => handleNavClick(VIEWS.BOARD)}
              >
                <span className="menu-icon">📋</span>
                <span>Board</span>
              </button>
              {!isProjectRoleClient && (
                <button
                  type="button"
                  className={`menu-item ${mainView === VIEWS.CALENDAR ? 'active' : ''}`}
                  onClick={() => handleNavClick(VIEWS.CALENDAR)}
                >
                  <span className="menu-icon">📅</span>
                  <span>Calendar</span>
                </button>
              )}
              {!isProjectRoleClient && (
                <button
                  type="button"
                  className={`menu-item ${mainView === VIEWS.WORK_ITEMS ? 'active' : ''}`}
                  onClick={() => handleNavClick(VIEWS.WORK_ITEMS)}
                >
                  <span className="menu-icon">🧩</span>
                  <span>Work items</span>
                </button>
              )}
              {canShowMilestonesNav(userRole, projectRole) && (
                <button
                  type="button"
                  className={`menu-item ${mainView === VIEWS.MILESTONES ? 'active' : ''}`}
                  onClick={() => handleNavClick(VIEWS.MILESTONES)}
                >
                  <span className="menu-icon">🏁</span>
                  <span>Milestones</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="menu-section">
          <button
            type="button"
            className={`menu-item ${mainView === VIEWS.NOTIFICATIONS ? 'active' : ''}`}
            onClick={() => handleNavClick(VIEWS.NOTIFICATIONS)}
          >
            <span className="menu-icon">🔔</span>
            <span className="menu-label-with-badge">
              <span>Notifications</span>
              {notificationsCount > 0 && (
                <span className="menu-badge">{notificationsCount}</span>
              )}
            </span>
          </button>

          {showUserManagement && (
            <button
              type="button"
              className={`menu-item ${mainView === VIEWS.USER_MANAGEMENT ? 'active' : ''}`}
              onClick={() => handleNavClick(VIEWS.USER_MANAGEMENT)}
            >
              <span className="menu-icon">⚙️</span>
              <span>Users</span>
            </button>
          )}
          {showRoles && (
            <button
              type="button"
              className={`menu-item ${mainView === VIEWS.ROLES ? 'active' : ''}`}
              onClick={() => handleNavClick(VIEWS.ROLES)}
            >
              <span className="menu-icon">🛡️</span>
              <span>Access Control</span>
            </button>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button type="button" onClick={onLogout} className="logout-btn-sidebar">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default DashboardNavBar;
export { VIEWS as DASHBOARD_VIEWS };
