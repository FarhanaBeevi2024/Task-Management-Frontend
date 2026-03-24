import React, { useState } from 'react';
import './ProjectForm.css';

/**
 * Modal form for creating a new project.
 */
function ProjectForm({ onSubmit, onCancel }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ key, name, description, client_id: null });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="project-form-title">
        <div className="modal-content project-form-modal">
          <h2 id="project-form-title">Create Project</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="project-key">Project Key *</label>
              <input
                id="project-key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                required
                placeholder="e.g., PROJ"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label htmlFor="project-name">Project Name *</label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter project name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="project-description">Description</label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={onCancel} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Create Project
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}

export default ProjectForm;
