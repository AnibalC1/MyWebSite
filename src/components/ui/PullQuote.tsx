import Reveal from './Reveal';

type Props = {
  children: React.ReactNode;
  attribution?: string;
};

export default function PullQuote({ children, attribution }: Props) {
  return (
    <Reveal className="container-content section flex flex-col items-center text-center">
      <div className="hairline mb-12" style={{ width: '48px', background: 'var(--gold)' }} />
      <p className="pull-quote">{children}</p>
      {attribution && (
        <p
          className="mt-10"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          — {attribution}
        </p>
      )}
      <div className="hairline mt-12" style={{ width: '48px', background: 'var(--gold)' }} />
    </Reveal>
  );
}
