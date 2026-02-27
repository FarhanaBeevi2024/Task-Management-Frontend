# Access configuration

Access is controlled by **`accessConfig.json`** in this folder.

- **Backend** uses its own copy: `backend/accessConfig.json` (keep both in sync when editing).
- **Frontend** uses this file for UI (who sees "Create Project", "User management", etc.).

## Structure

Under `roles`, each role has:

- **`global`** – app-wide permissions:
  - `canManageUsers` – User management screen and changing other users’ roles
  - `canViewAllUsers` – List all users (e.g. for task assignment)
  - `canCreateProjects` – Create new projects
  - `canViewAllProjects` – See all projects (otherwise only projects they’re in via `project_members`)

- **`project`** – per-project permissions (used by backend):
  - `autoMemberOnCreate` – When this role creates a project, add them as a project member
  - `canManageMembers` – Add/remove project members
  - `canCreateIssues` – Create issues in a project
  - `canAssignIssuesToOthers` – Assign issues to other users

Set any value to `true` or `false`. Unknown roles fall back to `user`. After editing JSON, restart backend and refresh the frontend.
