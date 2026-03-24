/**
 * Internal workflow status (independent of Kanban column status).
 * Keep in sync with backend/workflowStatus.js.
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

/** First four workflow steps — only for board column `in_progress`. */
export const WORKFLOW_STATUSES_FOR_IN_PROGRESS = [
  'Dev In Progress',
  'Dev Complete',
  'Released for UAT',
  'UAT In Progress',
];

/** Last four workflow steps — only for board column `in_review`. */
export const WORKFLOW_STATUSES_FOR_IN_REVIEW = [
  'UAT Complete',
  'Production Released',
  'Require Internal Clarification',
  'Waiting for Client Clarification',
];

const FULL_SET = new Set(WORKFLOW_STATUSES);
const IN_PROGRESS_SET = new Set(WORKFLOW_STATUSES_FOR_IN_PROGRESS);
const IN_REVIEW_SET = new Set(WORKFLOW_STATUSES_FOR_IN_REVIEW);

/** Workflow dropdown is only editable on these board columns. */
export function isWorkflowStatusEditableForBoard(boardStatus) {
  const s = String(boardStatus || '').trim();
  return s === 'in_progress' || s === 'in_review';
}

/** Options shown in the workflow dropdown for the current board column. */
export function getWorkflowOptionsForBoard(boardStatus) {
  const s = String(boardStatus || '').trim();
  if (s === 'in_progress') return [...WORKFLOW_STATUSES_FOR_IN_PROGRESS];
  if (s === 'in_review') return [...WORKFLOW_STATUSES_FOR_IN_REVIEW];
  return [...WORKFLOW_STATUSES];
}

export function defaultWorkflowForBoardStatus(boardStatus) {
  const s = String(boardStatus || '').trim();
  if (s === 'in_review') return WORKFLOW_STATUSES_FOR_IN_REVIEW[0];
  if (s === 'in_progress') return WORKFLOW_STATUSES_FOR_IN_PROGRESS[0];
  return DEFAULT_WORKFLOW_STATUS;
}

/**
 * @param {unknown} value
 * @param {string} [boardStatus] issues.status
 */
export function normalizeWorkflowStatus(value, boardStatus) {
  if (value == null || value === '') {
    return defaultWorkflowForBoardStatus(boardStatus);
  }
  const str = String(value).trim();
  if (!FULL_SET.has(str)) return defaultWorkflowForBoardStatus(boardStatus);
  const bs = String(boardStatus || '').trim();
  if (bs === 'in_progress' && IN_PROGRESS_SET.has(str)) return str;
  if (bs === 'in_review' && IN_REVIEW_SET.has(str)) return str;
  if (bs === 'in_progress') return WORKFLOW_STATUSES_FOR_IN_PROGRESS[0];
  if (bs === 'in_review') return WORKFLOW_STATUSES_FOR_IN_REVIEW[0];
  return str;
}

/**
 * @param {string} status
 */
export function getWorkflowStatusBadgeVariant(status) {
  const s = FULL_SET.has(String(status || '').trim())
    ? String(status).trim()
    : DEFAULT_WORKFLOW_STATUS;
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
