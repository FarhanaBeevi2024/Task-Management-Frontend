import React from 'react';
import './ProjectCard.css';

/** Trash / recycle-bin icon — vector so it looks the same on every OS */
function TrashBinIcon() {
  return (
    <svg
      className="project-delete-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ProjectCard = ({ project, onClick, onDelete }) => {
  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-header">
        <div className="project-key">{project.key}</div>
        <div className="project-header-actions">
          <div className="project-status">Active</div>
          {onDelete && (
            <button
              type="button"
              className="project-delete-btn"
              title="Move project to trash"
              aria-label="Delete project"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <span className="project-delete-btn-inner">
                <TrashBinIcon />
              </span>
            </button>
          )}
        </div>
      </div>
      <h3 className="project-name">{project.name}</h3>
      {project.description && (
        <p className="project-description">{project.description}</p>
      )}
      <div className="project-footer">
        <div className="project-meta">
          <span className="project-icon">👥</span>
          <span>Team</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

