import React from 'react';
import {
  WORKFLOW_STATUSES,
  normalizeWorkflowStatus,
  getWorkflowStatusBadgeVariant,
} from '../constants/workflowStatus.js';
import './WorkflowStatusSelect.css';

/**
 * Reusable workflow status control + optional colored badge.
 * @param {{
 *   value: string | null | undefined;
 *   onChange?: (next: string) => void;
 *   disabled?: boolean;
 *   readOnly?: boolean;
 *   className?: string;
 *   selectClassName?: string;
 *   size?: 'compact' | 'default';
 *   showBadge?: boolean;
 *   badgeOnly?: boolean; // true = badge only (Kanban cards)
 *   id?: string;
 *   'aria-label'?: string;
 * }} props
 */
export default function WorkflowStatusSelect({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  className = '',
  selectClassName = '',
  size = 'default',
  showBadge = false,
  badgeOnly = false,
  id,
  'aria-label': ariaLabel = 'Workflow status',
}) {
  const normalized = normalizeWorkflowStatus(value);
  const variant = getWorkflowStatusBadgeVariant(normalized);
  const isLocked = disabled || readOnly;
  const sizeClass = size === 'compact' ? 'workflow-status-field--compact' : '';

  if (badgeOnly) {
    const compactClass = size === 'compact' ? 'workflow-status-badge--compact' : '';
    return (
      <span
        id={id}
        className={`workflow-status-badge workflow-status-badge--${variant} ${compactClass} ${className}`.trim()}
        title={normalized}
        role="status"
        aria-label={`${ariaLabel}: ${normalized}`}
      >
        {normalized}
      </span>
    );
  }

  return (
    <div className={`workflow-status-field ${sizeClass} ${className}`.trim()}>
      {showBadge && (
        <span
          className={`workflow-status-badge workflow-status-badge--${variant}`}
          title={normalized}
        >
          {normalized}
        </span>
      )}
      <select
        id={id}
        className={`workflow-status-select ${selectClassName}`.trim()}
        value={normalized}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={isLocked}
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {WORKFLOW_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
