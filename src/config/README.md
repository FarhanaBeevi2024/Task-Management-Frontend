# Config

## Role access (permissions)

Global and project permissions for each **user role** (`superadmin`, `admin`, `team_leader`, etc.) are stored in the database table **`role_access_config`**.

- **Admin UI:** Jira dashboard sidebar → **Access Control** (below **Users**). Users need the **Manage users** permission (`canManageUsers`) to open it.
- **API:** `GET /api/access-config` (authenticated), `PUT /api/admin/role-access` (same permission as user management).
- **Migration:** Run `database/role_access_config.sql` in the Supabase SQL Editor once.
- **Fallback:** If the table is missing or empty, the backend uses built-in defaults from `backend/roleAccessStore.js` and logs a warning.

The React app loads permissions via **`AccessConfigProvider`** (`frontend/src/context/AccessConfigContext.jsx`).

### Where each flag is enforced (summary)

| Flag | Backend | Frontend (UX) |
|------|---------|-----------------|
| **canManageUsers** | `PUT /api/admin/users/*`, `PUT /api/admin/role-access` | Users + Access Control menus |
| **canViewAllUsers** | `GET /api/users` (org list: with **canManageUsers** or **canViewAllUsers**; superadmin “all profiles” branch still requires **canViewAllUsers**) | User lists / assignee dropdowns only load if API allows |
| **canCreateProjects** | `POST /api/jira/projects` | Create Project button |
| **canViewAllProjects** | `GET /api/jira/projects` (all org projects vs member-only); `GET /api/jira/projects/:id`; issues/sprints/milestones use **project access** | Project list from API |
| **autoMemberOnCreate** | `POST /api/jira/projects` (add creator to `project_members`) | — |
| **canManageMembers** | `PUT /api/jira/projects/:id`, member POST/DELETE, `DELETE /api/jira/projects/:id`; `GET /api/jira/projects/:id/members` (member **or** this flag) | Project Overview members; project delete on cards |
| **canCreateIssues** | `POST /api/jira/issues` (+ project access) | Board FAB; subtasks |
| **canAssignIssuesToOthers** | `POST /api/jira/issues` (assignee); `PUT /api/jira/issues/:id` (power roles) | Board assignee select; Issue detail “Assign to” |
| **canManageMilestones** | Milestone POST/PUT/DELETE | Milestones page; Issue detail milestone picker |

**Project access:** For a given `project_id`, the user must be in **`project_members`** **or** have **canViewAllProjects** (same org). Applied to listing/fetching issues, creating issues, sprints, milestones, and single-issue reads/updates.
