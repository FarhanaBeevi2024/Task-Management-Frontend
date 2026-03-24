import React from 'react';
import {
  getWorkflowOptionsForBoard,
  isWorkflowStatusEditableForBoard,
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
 *   boardStatus?: string; // issues.status — filters dropdown to In Progress / In Review workflow sets
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
  boardStatus,
  id,
  'aria-label': ariaLabel = 'Workflow status',
}) {
  const editable = boardStatus == null || isWorkflowStatusEditableForBoard(boardStatus);
  const options = editable
    ? getWorkflowOptionsForBoard(boardStatus)
    : [normalizeWorkflowStatus(value, boardStatus)];
  const normalized = normalizeWorkflowStatus(value, boardStatus);
  const variant = getWorkflowStatusBadgeVariant(normalized);
  const isLocked = disabled || readOnly || !editable;
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
        {options.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
