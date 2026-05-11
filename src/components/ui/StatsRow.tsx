import Reveal from './Reveal';

export type Stat = {
  value: string;
  label: string;
  desc?: string;
};

type Props = {
  stats: Stat[];
  className?: string;
};

export default function StatsRow({ stats, className = '' }: Props) {
  return (
    <div className={`container-wide section ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-14 md:gap-x-16">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="flex flex-col">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)',
                  letterSpacing: '-0.03em',
                  color: 'var(--gold)',
                  lineHeight: 1,
                }}
              >
                {s.value}
              </span>
              <div className="hairline mt-5 mb-5" style={{ width: '36px', background: 'var(--gold-hairline-strong)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--warm-white)',
                  fontWeight: 500,
                }}
              >
                {s.label}
              </span>
              {s.desc && (
                <p
                  className="mt-3 max-w-[32ch]"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.92rem',
                    lineHeight: 1.7,
                    color: 'var(--warm-white-muted)',
                    fontWeight: 300,
                  }}
                >
                  {s.desc}
                </p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
