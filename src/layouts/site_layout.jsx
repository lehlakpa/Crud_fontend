import { useSyncExternalStore } from 'react';
import { getRetrySeconds, subscribeRateLimit } from '../services/rateLimit.js';
import Link from '../components/link.jsx';
export default function SiteLayout({
  admin,
  auth,
  children
}) {
  const retrySeconds = useSyncExternalStore(subscribeRateLimit, getRetrySeconds);
  return <>
    <header className="site-header">
      <Link className="brand" to="/">
        <span className="brand-mark">✳</span> everyday<span className="brand-dot">.</span>
      </Link>
      <nav>
        <Link to="/" className={!admin && !auth ? 'selected' : ''}>The collection</Link>
        <Link to={admin ? '/admin' : '/admin/login'} className="admin-link">
          {admin ? 'Admin workspace' : 'Store admin'} <span>↗</span>
        </Link>
      </nav>
    </header>
    {retrySeconds > 0 && <p className="notice error rate-limit-notice" role="status">
          Too many requests. Please wait {retrySeconds} seconds before trying again.
        </p>}
    <fieldset className="request-controls" disabled={retrySeconds > 0}>{children}</fieldset>
    <footer>
      <Link className="brand" to="/">everyday.</Link>
      <p>A little more joy in the everyday.</p>
      <span>Thoughtful finds. Delivered to you.</span>
    </footer>
  </>;
}
