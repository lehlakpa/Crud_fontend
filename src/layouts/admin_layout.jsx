import { useState } from 'react';
import { sessionClient } from '../services/session.js';
import Link from '../components/link.jsx';
export default function AdminLayout({
  path,
  navigate,
  children
}) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await sessionClient.logout();
    } catch {/* Local session is always cleared. */} finally {
      navigate('/admin/login');
    }
  }
  return <div className="admin-layout">
    <aside className="sidebar">
      <p className="eyebrow">YOUR WORKSPACE</p>
      <nav>{[['/admin', '▦', 'Overview'], ['/admin/products', '◇', 'Products'], ['/admin/orders', '▤', 'Orders'], ['/admin/low-stock', '◷', 'Low stock']].map(([url, icon, label]) => <Link key={url} to={url} className={path === url || url === '/admin/products' && path.startsWith('/admin/products/') ? 'active' : ''}>
          <span>{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-bottom">
        <p>A little care.<br />A thriving store.</p>
        <button className="secondary" disabled={busy} onClick={logout}>{busy ? 'Signing out…' : 'Sign out ↗'}</button>
      </div>
    </aside>
    <main className="admin-main">{children}</main>
  </div>;
}
