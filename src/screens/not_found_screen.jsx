import Link from '../components/link.jsx';
export default function NotFoundScreen() {
  return <section className="empty-state">
    <p className="eyebrow">404</p>
    <h1>A little off the path.</h1>
    <Link to="/" className="primary inline">Back to the collection</Link>
  </section>;
}
