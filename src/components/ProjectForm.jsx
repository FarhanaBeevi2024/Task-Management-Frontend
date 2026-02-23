import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClientForm from './ClientForm.jsx';
import './ProjectForm.css';

/**
 * Modal form for creating a new project.
 * Supports optional client selection and inline creation of a new client.
 */
function ProjectForm({ session, onSubmit, onCancel }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/jira/clients', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setClients(response.data ?? []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateClient = async (clientData) => {
    try {
      const response = await axios.post('/api/jira/clients', clientData, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setClientId(response.data.id);
      setShowClientForm(false);
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ key, name, description, client_id: clientId || null });
  };

  return (
    <>
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
            <div className="form-group">
              <label htmlFor="project-client">Client / Customer</label>
              <div className="form-row-inline">
                <select
                  id="project-client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">No Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-secondary" onClick={() => setShowClientForm(true)}>
                  + New
                </button>
              </div>
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
      {showClientForm && (
        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setShowClientForm(false)}
        />
      )}
    </>
  );
}

export default ProjectForm;
