import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import './Login.css';

/**
 * Sign in only. New accounts are created via invitation link (?invite=...).
 */
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signErr) throw signErr;

      if (data.session) {
        onLogin(data.session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setRecoveryLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/public/auth/recovery-action', { email });
      setSuccess(res.data?.message || 'If your email exists, we will send password reset instructions.');
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Reset password failed');
      setSuccess('');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <p className="login-back">
          <Link to="/">← Back to home</Link>
        </p>
        <div className="login-brand">
          <img
            src="/task-flow-logo.png"
            alt=""
            width={56}
            height={56}
            className="login-brand-logo"
            decoding="async"
          />
          <span className="login-brand-name">Task Flow</span>
        </div>
        <h2>Sign In</h2>
        <p className="login-hint">
          New here? Use the invitation link from your email to create your account.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="error-message" style={{ borderColor: '#bbf7d0', background: '#dcfce7', color: '#166534' }}>
              {success}
            </div>
          )}
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="submit-btn"
            disabled={recoveryLoading}
            onClick={handleResetPassword}
            title="Set a new password using Supabase recovery"
          >
            {recoveryLoading ? 'Preparing...' : 'Reset password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
