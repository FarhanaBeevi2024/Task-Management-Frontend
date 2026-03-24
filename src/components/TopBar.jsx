import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOrganization } from '../context/OrganizationContext.jsx';
import './TopBar.css';

function initialsFromNames(firstName, lastName) {
  const f = (firstName || '').toString().trim();
  const l = (lastName || '').toString().trim();
  const fi = f ? f.charAt(0).toUpperCase() : '';
  const li = l ? l.charAt(0).toUpperCase() : '';
  if (fi && li) return `${fi}${li}`;
  if (fi) return fi;
  if (li) return li;
  return null;
}

/**
 * Tiny horizontal top bar:
 * - left: project switcher
 * - right: organization name (+ switch if multiple) + user dropdown + logout
 */
export default function TopBar({
  currentUser,
  onLogout,
}) {
  const { organizations, activeOrganizationId, switchOrganization } = useOrganization();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const orgName = useMemo(() => {
    const match = organizations.find((o) => String(o.id) === String(activeOrganizationId));
    return match?.name || '';
  }, [organizations, activeOrganizationId]);

  const avatarInitials = useMemo(() => {
    // Backend now returns first_name/last_name via GET /api/user.
    const i = initialsFromNames(currentUser?.first_name, currentUser?.last_name);
    if (i) return i;
    // Fallback to email.
    const email = (currentUser?.email || '').toString().trim();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  }, [currentUser?.first_name, currentUser?.last_name, currentUser?.email]);

  const fullName = useMemo(() => {
    const f = (currentUser?.first_name || '').toString().trim();
    const l = (currentUser?.last_name || '').toString().trim();
    if (f || l) return `${f} ${l}`.trim();
    const email = (currentUser?.email || '').toString().trim();
    if (email) return email.split('@')[0] || email;
    return 'User';
  }, [currentUser?.first_name, currentUser?.last_name, currentUser?.email]);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-right">
        <div className="topbar-org">
          {organizations.length > 1 ? (
            <>
              <span className="topbar-org-prefix">Org</span>
              <select
                className="topbar-org-select"
                value={activeOrganizationId || ''}
                onChange={(e) => switchOrganization(e.target.value)}
                aria-label="Switch organization"
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <span className="topbar-org-name">{orgName}</span>
            </>
          )}
        </div>

        <div className="topbar-user" ref={menuRef}>
          <button
            type="button"
            className="topbar-user-avatar"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-label="User menu"
          >
            {avatarInitials}
          </button>

          {userMenuOpen && (
            <div className="topbar-user-menu">
              <div className="topbar-user-menu-name">{fullName}</div>
              <div className="topbar-user-menu-email">{currentUser?.email ?? ''}</div>
              <div className="topbar-user-menu-divider" />
              <button type="button" className="topbar-logout-btn" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

