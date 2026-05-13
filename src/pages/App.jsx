import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import {
  supabase,
  getInitialSupabaseAuthHashType,
  getInitialSupabaseAuthQueryType,
} from '../services/supabase';
import Login from '../components/Login.jsx';
import LandingPage from './LandingPage.jsx';
import InviteSignup from '../components/InviteSignup.jsx';
import ResetPassword from '../components/ResetPassword.jsx';
import AuthenticatedHome from './AuthenticatedHome.jsx';
import { ConfirmProvider } from '../context/ConfirmContext.jsx';
import { setApiAccessToken, setActiveOrganizationId } from '../services/api';
import 'react-toastify/dist/ReactToastify.css';

function readInviteTokenFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite')?.trim() || null;
  } catch {
    return null;
  }
}

/** Flows that must not open the “reset password” screen (invite / signup / magic link). */
const NON_RECOVERY_HASH_TYPES = new Set(['invite', 'signup', 'magiclink', 'email', 'email_change']);

function isRecoveryFlowFromUrl() {
  try {
    if (readInviteTokenFromUrl()) return false;
    const query = new URLSearchParams(window.location.search);
    const hashRaw = (window.location.hash || '').replace(/^#/, '');
    const hash = new URLSearchParams(hashRaw);
    const t = (query.get('type') || hash.get('type') || '').toLowerCase();
    if (NON_RECOVERY_HASH_TYPES.has(t)) return false;
    return t === 'recovery';
  } catch {
    return false;
  }
}

/** True only when the auth callback was explicitly password recovery (not signup/invite). */
function isExplicitRecoveryAuthCallback() {
  if (readInviteTokenFromUrl()) return false;
  const initial = getInitialSupabaseAuthHashType();
  if (NON_RECOVERY_HASH_TYPES.has(initial)) return false;
  return initial === 'recovery';
}

function shouldOpenRecoveryAfterPasswordRecoveryEvent() {
  return isExplicitRecoveryAuthCallback();
}

function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState(() => readInviteTokenFromUrl());
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(() => {
    if (readInviteTokenFromUrl()) return false;
    const fromHash = getInitialSupabaseAuthHashType();
    const fromQuery = getInitialSupabaseAuthQueryType();
    if (NON_RECOVERY_HASH_TYPES.has(fromHash) || NON_RECOVERY_HASH_TYPES.has(fromQuery)) {
      return false;
    }
    if (fromHash === 'recovery' || fromQuery === 'recovery') return true;
    return isRecoveryFlowFromUrl();
  });

  useEffect(() => {
    const onPop = () => {
      setInviteToken(readInviteTokenFromUrl());
      setShowRecoveryFlow(isRecoveryFlowFromUrl());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setApiAccessToken(s?.access_token || null);
      })
      .catch(() => {
        setSession(null);
        setApiAccessToken(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Invite/signup redirects sometimes trigger this; only show reset UI for real recovery.
        setShowRecoveryFlow(shouldOpenRecoveryAfterPasswordRecoveryEvent());
      }
      if (event === 'SIGNED_IN' && s) {
        // After normal login or invite completion, never leave reset-password UI stuck on.
        if (!isExplicitRecoveryAuthCallback()) {
          setShowRecoveryFlow(false);
        }
      }
      setSession(s);
      setApiAccessToken(s?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (newSession) => {
    setSession(newSession);
    setApiAccessToken(newSession?.access_token || null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setApiAccessToken(null);
    setActiveOrganizationId(null);
    navigate('/', { replace: true });
  };

  const clearInviteFromUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url.pathname + url.search || window.location.pathname);
    } catch {
      /* ignore */
    }
    setInviteToken(null);
    setShowRecoveryFlow(false);
  };

  const clearRecoveryFromUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.pathname + url.search || window.location.pathname);
      if (window.location.hash) {
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } catch {
      /* ignore */
    }
    setShowRecoveryFlow(false);
  };

  const showInviteFlow = useMemo(() => Boolean(inviteToken), [inviteToken]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <ConfirmProvider>
        <ToastContainer
          position="top-right"
          autoClose={4500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          limit={5}
        />
        {showInviteFlow ? (
        <InviteSignup
          token={inviteToken}
          session={session}
          onCompleteSignIn={() => {
            clearInviteFromUrl();
          }}
        />
      ) : showRecoveryFlow ? (
        <ResetPassword
          onDone={async () => {
            clearRecoveryFromUrl();
            await supabase.auth.signOut();
            setSession(null);
            setApiAccessToken(null);
            setActiveOrganizationId(null);
            navigate('/sign-in', { replace: true });
          }}
        />
      ) : session ? (
        <AuthenticatedHome session={session} onLogout={handleLogout} />
      ) : (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/reset-password"
            element={<Navigate to="/sign-in" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      </ConfirmProvider>
    </div>
  );
}

export default App;
