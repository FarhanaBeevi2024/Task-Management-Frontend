import React from 'react';
import ProjectCard from './ProjectCard.jsx';
import './ProjectsView.css';

/**
 * Projects list view: header, grid of project cards, and create button.
 * Does not include the create-project modal; parent controls that.
 */
function ProjectsView({ projects, onSelectProject, onCreateProjectClick, title = 'Projects', showCreateButton = true }) {
  return (
    <>
      <div className="projects-view-header">
        <div>
          <h1>{title}</h1>
          <p>{title === 'Project updates' ? 'Select a project to see completed, pending, and exposed-to-client tasks' : 'Select a project to view its board'}</p>
        </div>
        {showCreateButton && (
          <button
            type="button"
            onClick={onCreateProjectClick}
            className="create-project-btn"
          >
            + Create Project
          </button>
        )}
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started!</p>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project)}
            />
          ))
        )}
      </div>
    </>
  );
}

export default ProjectsView;
