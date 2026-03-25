import React from 'react';
import { useAccessConfig } from '../context/AccessConfigContext.jsx';
import { useOrganization } from '../context/OrganizationContext.jsx';
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
function DashboardNavBar({
  mainView,
  onViewChange,
  onLogout,
  userRole,
  selectedProject,
  onBackToProjects,
  projectRole,
  orgMemberRole = null,
}) {
  const { canManageUsers, canShowMilestonesNav } = useAccessConfig();
  const { organizations, activeOrganizationId, switchOrganization } = useOrganization();
  const isProjectRoleClient = projectRole === 'client';
  const showUserManagement = canManageUsers(userRole) || orgMemberRole === 'admin';
  const showRoles = canManageUsers(userRole);

  const orgName = (() => {
    const match = (organizations || []).find((o) => String(o.id) === String(activeOrganizationId));
    return match?.name || null;
  })();

  const handleNavClick = (view) => {
    if (onViewChange) onViewChange(view);
  };

  const handleOrganizationChange = (orgId) => {
    switchOrganization(orgId);
    // Changing workspace should always bring user back to the projects list.
    if (onBackToProjects) onBackToProjects();
    if (onViewChange) onViewChange(VIEWS.PROJECTS);
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-project-switcher">
        <button
          type="button"
          className="sidebar-brand-btn"
          onClick={onBackToProjects}
          title="Task Management"
        >
          <span className="sidebar-brand-icon" aria-hidden="true">
            ✓
          </span>
          <span className="sidebar-brand-text">Task Management</span>
        </button>
      </div>

      <nav className="sidebar-menu">
        <div className="menu-section">
          {!selectedProject && organizations.length > 0 && (
            <>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  className={`menu-item ${String(activeOrganizationId) === String(org.id) ? 'active' : ''}`}
                  onClick={() => handleOrganizationChange(org.id)}
                  title={org.name}
                >
                  <span className="menu-icon">📊</span>
                  <span>{org.name}</span>
                </button>
              ))}
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
                <span>{selectedProject?.name || 'Overview'}</span>
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

      {/* Logout handled via TopBar user menu */}
    </aside>
  );
}

export default DashboardNavBar;
export { VIEWS as DASHBOARD_VIEWS };
