import React, { useEffect, useState } from 'react';
import JiraDashboard from './JiraDashboard.jsx';
import SuperAdminDashboard from './SuperAdminDashboard.jsx';
import { AccessConfigProvider } from '../context/AccessConfigContext.jsx';
import { api } from '../services/api';

function AuthenticatedHome({ session, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/user');
        if (!cancelled) setUserRole(res.data?.role || 'user');
      } catch {
        if (!cancelled) setUserRole('user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [session?.access_token]);

  if (loading) return <div style={{ padding: '1.5rem' }}>Loading...</div>;

  if (userRole === 'superadmin') {
    return <SuperAdminDashboard onLogout={onLogout} />;
  }

  return (
    <AccessConfigProvider session={session}>
      <JiraDashboard session={session} onLogout={onLogout} />
    </AccessConfigProvider>
  );
}

export default AuthenticatedHome;

