import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import Login from '../components/Login.jsx';
import AuthenticatedHome from './AuthenticatedHome.jsx';
import { setApiAccessToken } from '../services/api';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setApiAccessToken(session?.access_token || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setApiAccessToken(session?.access_token || null);
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
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {session ? (
        <AuthenticatedHome session={session} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;

