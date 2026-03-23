/**
 * Internal workflow status (independent of Kanban column status).
 * Keep in sync with backend/workflowStatus.js allowed values.
 */
export const DEFAULT_WORKFLOW_STATUS = 'Dev In Progress';

export const WORKFLOW_STATUSES = [
  'Dev In Progress',
  'Dev Complete',
  'Released for UAT',
  'UAT In Progress',
  'UAT Complete',
  'Production Released',
  'Require Internal Clarification',
  'Waiting for Client Clarification',
];

const SET = new Set(WORKFLOW_STATUSES);

/** @param {unknown} value */
export function normalizeWorkflowStatus(value) {
  if (value == null || value === '') return DEFAULT_WORKFLOW_STATUS;
  const s = String(value).trim();
  return SET.has(s) ? s : DEFAULT_WORKFLOW_STATUS;
}

/**
 * Badge color token for UI (maps to CSS modifiers).
 * @param {string} status
 */
export function getWorkflowStatusBadgeVariant(status) {
  const s = normalizeWorkflowStatus(status);
  const map = {
    'Dev In Progress': 'dev',
    'Dev Complete': 'dev-done',
    'Released for UAT': 'uat-release',
    'UAT In Progress': 'uat',
    'UAT Complete': 'uat-done',
    'Production Released': 'prod',
    'Require Internal Clarification': 'clarify-internal',
    'Waiting for Client Clarification': 'clarify-client',
  };
  return map[s] || 'dev';
}
