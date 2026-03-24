import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import './Login.css';

/**
 * Invitation completion: password-based sign-in only (no magic links).
 * After org is linked, user is signed out and uses Go to login, then signs in with password.
 */
function InviteSignup({ token, session, onCompleteSignIn }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAuthLink, setGeneratingAuthLink] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [meta, setMeta] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [existingUserLinking, setExistingUserLinking] = useState(false);
  /** Shown when invite link API returns USER_ALREADY_REGISTERED (e.g. timing vs profile). */
  const [loginMode, setLoginMode] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinSigningIn, setJoinSigningIn] = useState(false);

  const onCompleteSignInRef = useRef(onCompleteSignIn);
  useEffect(() => {
    onCompleteSignInRef.current = onCompleteSignIn;
  }, [onCompleteSignIn]);

  useEffect(() => {
    setLoginMode(false);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/public/invitations/${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Invalid invitation');
        if (!cancelled) setMeta(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load invitation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleReturnToLogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    onCompleteSignInRef.current?.();
  };

  const completeExistingUserInvite = useCallback(
    async (abortSignal) => {
      setExistingUserLinking(true);
      setError('');
      try {
        await api.post(
          `/api/public/invitations/${encodeURIComponent(token)}/signup`,
          {
            first_name: '',
            last_name: '',
            password: '',
          },
          abortSignal ? { signal: abortSignal } : {}
        );
        await supabase.auth.signOut();
        const org = meta?.organization_name || 'the organization';
        setSuccess(
          `You’ve been added to ${org}. Use Go to login and sign in with your email and password.`
        );
      } catch (e2) {
        if (abortSignal?.aborted) return;
        if (axios.isCancel?.(e2) || e2?.code === 'ERR_CANCELED') return;
        const status = e2?.response?.status;
        const msg = e2?.response?.data?.error || e2.message || '';
        if (status === 404 || /not found|already used/i.test(msg)) {
          await supabase.auth.signOut();
          const org = meta?.organization_name || 'the organization';
          setSuccess(
            `You’re set up with ${org}. Use Go to login and sign in with your email and password.`
          );
        } else {
          setError(msg || 'Failed to complete invitation');
        }
      } finally {
        if (!abortSignal?.aborted) setExistingUserLinking(false);
      }
    },
    [token, meta?.organization_name]
  );

  useEffect(() => {
    if (!session?.access_token || !meta?.is_existing_user || success) return;

    const ac = new AbortController();
    completeExistingUserInvite(ac.signal);

    return () => ac.abort();
  }, [session?.access_token, meta?.is_existing_user, token, success, completeExistingUserInvite]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (meta?.is_existing_user) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const pass = password;
      const pass2 = confirmPassword;
      if (!pass || !pass2) throw new Error('Password and confirm password are both required');
      if (pass.length < 6) throw new Error('Password must be at least 6 characters');
      if (pass !== pass2) throw new Error('Password and confirm password do not match');

      await api.post(`/api/public/invitations/${encodeURIComponent(token)}/signup`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password: pass,
      });
      await supabase.auth.signOut();
      const org = meta?.organization_name || 'the organization';
      setSuccess(
        `You’ve been added to ${org}. Use Go to login and sign in with your email and password.`
      );
    } catch (e2) {
      setError(e2?.response?.data?.error || e2.message || 'Invite completion failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueInSupabase = async () => {
    setError('');
    setSuccess('');
    setGeneratingAuthLink(true);
    try {
      const res = await api.post(
        `/api/public/invitations/${encodeURIComponent(token)}/supabase-action-link`
      );
      const actionLink = res.data?.action_link;
      if (!actionLink) throw new Error('Failed to generate Supabase action link');
      window.location.href = actionLink;
    } catch (e2) {
      const status = e2?.response?.status;
      const code = e2?.response?.data?.code;
      if (status === 409 && code === 'USER_ALREADY_REGISTERED') {
        setLoginMode(true);
        setError('');
      } else {
        setError(e2?.response?.data?.error || e2.message || 'Failed to generate Supabase link');
      }
    } finally {
      setGeneratingAuthLink(false);
    }
  };

  const handleSignInToJoin = async (e) => {
    e.preventDefault();
    setJoinSigningIn(true);
    setError('');
    try {
      const email = meta?.email;
      if (!email) throw new Error('Email missing');
      if (!joinPassword) throw new Error('Password is required');
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: joinPassword,
      });
      if (signErr) throw signErr;
    } catch (e2) {
      setError(e2?.message || 'Sign in failed');
    } finally {
      setJoinSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <p>Loading invitation…</p>
        </div>
      </div>
    );
  }

  if (error && !meta) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Invitation</h2>
          <div className="error-message">{error}</div>
          <p className="toggle-mode">Ask your administrator for a new invite link.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Invitation complete</h2>
          <p className="login-hint">Your signup process has completed successfully.</p>
          <div
            className="error-message"
            style={{ borderColor: '#bbf7d0', background: '#dcfce7', color: '#166534' }}
          >
            {success}
          </div>
          <button type="button" className="submit-btn" onClick={handleReturnToLogin}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const showSignInToJoin = Boolean(!session && meta && (meta.is_existing_user || loginMode));

  if (showSignInToJoin) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Join organization</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Organization: <strong>{meta?.organization_name}</strong>
          </p>
          <p className="login-hint">
            Sign in with your email and password to link this organization to your account. Password sign-in is
            required.
          </p>
          <form onSubmit={handleSignInToJoin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={meta?.email || ''} readOnly disabled className="input-readonly" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={6}
                placeholder="Enter your password"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={joinSigningIn} className="submit-btn">
              {joinSigningIn ? 'Signing in…' : 'Sign in & join organization'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Complete your invitation</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Organization: <strong>{meta?.organization_name}</strong>
          </p>
          <div className="error-message" style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}>
            Continue to set your password on the secure signup page. You will return here afterward to finish
            setup. Sign-in always requires your password.
          </div>
          <button
            type="button"
            disabled={generatingAuthLink}
            className="submit-btn"
            onClick={handleContinueInSupabase}
            style={{ marginTop: '0.75rem' }}
          >
            {generatingAuthLink ? 'Preparing…' : 'Continue to set password'}
          </button>
          {meta?.email && (
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.75rem' }}>
              Using email: <strong>{meta.email}</strong>
            </p>
          )}
          {error && (
            <div className="error-message" style={{ marginTop: '0.75rem' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (meta?.is_existing_user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Organization access</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Organization: <strong>{meta?.organization_name}</strong>
          </p>
          {existingUserLinking && !error && (
            <p style={{ color: '#374151', fontSize: '0.95rem' }}>Linking your account…</p>
          )}
          {error && (
            <>
              <div className="error-message">{error}</div>
              <button
                type="button"
                className="submit-btn"
                style={{ marginTop: '0.75rem' }}
                disabled={existingUserLinking}
                onClick={() => completeExistingUserInvite()}
              >
                {existingUserLinking ? 'Retrying…' : 'Try again'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Complete your invitation</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Organization: <strong>{meta?.organization_name}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={meta?.email || ''} readOnly disabled className="input-readonly" />
          </div>
          <div className="form-group">
            <label>First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              placeholder="First name"
            />
          </div>
          <div className="form-group">
            <label>Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              placeholder="Last name"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Enter password"
            />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Confirm password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting ? 'Saving…' : 'Complete signup'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InviteSignup;
