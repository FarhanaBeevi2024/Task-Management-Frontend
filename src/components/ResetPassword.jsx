import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { notifySuccess } from '../utils/toastNotify.js';
import './Login.css';

function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Password and confirm password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }

    try {
      setSaving(true);
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setSuccess('Password reset successful. You can now sign in.');
      notifySuccess('Your password has been updated. You can sign in with your new password.', {
        autoClose: 4500,
      });
    } catch (e2) {
      setError(e2?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Reset Password</h2>
        <p className="login-hint">Enter your new password below.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              placeholder="Enter new password"
            />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              placeholder="Confirm new password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="error-message" style={{ borderColor: '#bbf7d0', background: '#dcfce7', color: '#166534' }}>
              {success}
            </div>
          )}
          <button type="submit" className="submit-btn" disabled={saving || !!success}>
            {saving ? 'Saving...' : 'Save new password'}
          </button>
          {success && (
            <button
              type="button"
              className="submit-btn"
              onClick={onDone}
              style={{ marginTop: '0.75rem' }}
            >
              Go to login
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;

