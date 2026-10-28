import { Link } from 'react-router-dom';

type Props = {
  title: string;
  description: string;
  phase: string;
};

/** Temporary page shown until a feature is built. */
export default function ComingSoon({ title, description, phase }: Props) {
  return (
    <section
      className="container"
      style={{ paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <h1 style={{ fontSize: 30 }}>{title}</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '60ch' }}>{description}</p>
      <p
        style={{
          alignSelf: 'flex-start',
          padding: '6px 12px',
          borderRadius: 999,
          background: 'var(--isu-gold-tint)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        Coming in {phase}
      </p>
      <Link to="/" className="btn btn-outline" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
        Back to home
      </Link>
    </section>
  );
}
