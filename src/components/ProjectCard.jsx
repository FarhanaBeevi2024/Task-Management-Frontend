import React from 'react';
import './ProjectCard.css';

const ProjectCard = ({ project, onClick }) => {
  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-header">
        <div className="project-key">{project.key}</div>
        <div className="project-status">Active</div>
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

