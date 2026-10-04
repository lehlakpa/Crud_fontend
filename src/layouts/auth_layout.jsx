import Link from '../components/link.jsx';
export default function AuthLayout({
  children
}) {
  return <main className="auth-shell">
    <section className="auth-intro">
      <p className="eyebrow">THE OTHER SIDE OF YOUR STORE</p>
      <h1>Good things<br />start <em>here.</em>
      </h1>
      <p>A calm space to manage your products,<br />care for your inventory, and keep things growing.</p>
      <span className="auth-flower" aria-hidden="true">✳</span>
      <Link to="/">← Back to the collection</Link>
    </section>
    <section className="form-panel">{children}</section>
  </main>;
}
