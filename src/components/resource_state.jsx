import Notice from './notice.jsx';
export default function ResourceState({
  resource,
  empty,
  children
}) {
  if (resource.loading) return <div className="empty-state" role="status">
    <span className="spinner" />Loading your store…</div>;
  return <>{resource.error && <div className="empty-state">
      <Notice error>{resource.error}</Notice>
      <button className="secondary" onClick={resource.reload}>Try again</button>
    </div>}{empty && !resource.error ? <div className="empty-state">
      <span className="empty-icon">◇</span>
      <h3>Nothing here just yet</h3>
      <p>Try another filter or check back soon.</p>
    </div> : resource.data && children}</>;
}
