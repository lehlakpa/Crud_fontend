import { useState, useEffect } from 'react';
import { sessionClient } from '../services/session.js';
import Link from './link.jsx';
import Notice from './notice.jsx';
export default function AdminGate({
  children,
  navigate
}) {
  const [state, setState] = useState({
    loading: true,
    error: ''
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const unsubscribe = sessionClient.subscribe(user => {
      if (!user && active) navigate('/admin/login', 'Please sign in to continue.');
    });
    sessionClient.authorizedRequest('/api/admin/me').then(() => {
      if (active) setState({
        loading: false,
        error: ''
      });
    }).catch(error => {
      if (!active) return;
      if (error.status === 401) navigate('/admin/login', 'Please sign in to continue.');else setState({
        loading: false,
        error: error.status === 403 ? `Access denied. ${error.message}` : error.message
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate, revision]);
  if (state.loading) return <div className="empty-state" role="status">Checking admin access…</div>;
  if (state.error) return <div className="page">
    <Notice error>{state.error}</Notice>
    <button className="secondary" onClick={() => setRevision(n => n + 1)}>Try again</button> <Link to="/">Return to store</Link>
  </div>;
  return children;
}
