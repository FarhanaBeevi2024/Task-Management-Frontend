import React, { useState } from 'react';
import './ClientForm.css';

/**
 * Modal form for creating a new client.
 */
function ClientForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, company, phone });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="client-form-title">
      <div className="modal-content client-form-modal">
        <h2 id="client-form-title">Create Client</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="client-name">Client Name *</label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter client name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-email">Email *</label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="client@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-company">Company</label>
            <input
              id="client-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-phone">Phone</label>
            <input
              id="client-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientForm;
