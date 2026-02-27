import React from 'react';
import { canManageUsers } from '../config/accessConfig.js';
import './DashboardNavBar.css';

const VIEWS = {
  PROJECTS: 'projects',
  OVERVIEW: 'overview',
  BOARD: 'board',
  WORK_ITEMS: 'work-items',
  USER_MANAGEMENT: 'user-management',
};

/**
 * Sidebar navigation. When a project is selected: current project (click = back to list), Overview, Board.
 * When no project: Projects, Recent issues, etc.
 */
function DashboardNavBar({ currentUser, mainView, onViewChange, onLogout, userRole, selectedProject, onBackToProjects }) {
  const isClient = userRole === 'client' || userRole === 'representative';
  const showUserManagement = canManageUsers(userRole);
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
              <button
                type="button"
                className={`menu-item ${mainView === VIEWS.WORK_ITEMS ? 'active' : ''}`}
                onClick={() => handleNavClick(VIEWS.WORK_ITEMS)}
              >
                <span className="menu-icon">🧩</span>
                <span>Work items</span>
              </button>
            </>
          )}
        </div>

        <div className="menu-section">
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
