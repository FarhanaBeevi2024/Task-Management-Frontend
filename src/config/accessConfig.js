/**
 * Access config: reads from accessConfig.json so you can control
 * who sees what (Create Project, User management, etc.) by editing the JSON.
 */
import config from './accessConfig.json';

const roles = config.roles || {};

function getRoleConfig(globalRole) {
  return roles[globalRole] || roles.user || {};
}

/** Can this role show the Create Project button and create projects? */
export function canUserCreateProject(globalRole) {
  return getRoleConfig(globalRole).global?.canCreateProjects === true;
}

/** Can this role see the User management screen and change other users' roles? */
export function canManageUsers(globalRole) {
  return getRoleConfig(globalRole).global?.canManageUsers === true;
}

/** Can this role see all projects (otherwise only projects they are members of)? */
export function canViewAllProjects(globalRole) {
  return getRoleConfig(globalRole).global?.canViewAllProjects === true;
}
