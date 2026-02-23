import React from 'react';
import './DashboardNavBar.css';

const VIEWS = {
  PROJECTS: 'projects',
  RECENT_ISSUES: 'recent-issues',
  PROJECT_UPDATES: 'project-updates',
};

/**
 * Static sidebar navigation. Same menu on every screen.
 * Projects and Recent issues navigate to those views; active item is highlighted.
 */
function DashboardNavBar({ currentUser, mainView, onViewChange, onLogout, userRole }) {
  const isClient = userRole === 'client' || userRole === 'representative';
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

      <nav className="sidebar-menu">
        <div className="menu-section">
          <button
            type="button"
            className={`menu-item ${mainView === VIEWS.PROJECTS ? 'active' : ''}`}
            onClick={() => handleNavClick(VIEWS.PROJECTS)}
          >
            <span className="menu-icon">📊</span>
            <span>Projects</span>
          </button>
          <button
            type="button"
            className={`menu-item ${mainView === VIEWS.RECENT_ISSUES ? 'active' : ''}`}
            onClick={() => handleNavClick(VIEWS.RECENT_ISSUES)}
          >
            <span className="menu-icon">📋</span>
            <span>Recent issues</span>
          </button>
          {isClient && (
            <button
              type="button"
              className={`menu-item ${mainView === VIEWS.PROJECT_UPDATES ? 'active' : ''}`}
              onClick={() => handleNavClick(VIEWS.PROJECT_UPDATES)}
            >
              <span className="menu-icon">📢</span>
              <span>Project updates</span>
            </button>
          )}
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
        <button type="button" onClick={onLogout} className="logout-btn-sidebar">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default DashboardNavBar;
export { VIEWS as DASHBOARD_VIEWS };
