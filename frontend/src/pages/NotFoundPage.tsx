import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section
      className="container"
      style={{ paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <h1 style={{ fontSize: 30 }}>Page not found</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>That page doesn’t exist.</p>
      <Link to="/" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
        Back to home
      </Link>
    </section>
  );
}
