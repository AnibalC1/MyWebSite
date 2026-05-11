'use client';

import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/ui/PageHero';
import StatsRow from '@/components/ui/StatsRow';
import PullQuote from '@/components/ui/PullQuote';
import Reveal from '@/components/ui/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';

const STATS = [
  { value: '8+', label: 'Years Training', desc: 'Consistent mat time across multiple academies.' },
  { value: '4x', label: 'Per Week', desc: 'Minimum training frequency, injuries notwithstanding.' },
  { value: '∞', label: 'Lessons Learned', desc: 'Every roll is a diagnostic. Every tap is data.' },
];

const PRINCIPLES = [
  {
    index: '01',
    title: 'Pressure is information.',
    body: 'In jiu-jitsu, where you feel pressure tells you where you are weak. In life, the same principle applies — discomfort is a signal, not a threat.',
  },
  {
    index: '02',
    title: 'Position before submission.',
    body: 'The most common mistake is attacking before control is established. In business, in relationships, in personal growth — the ones who rush the finish line rarely win.',
  },
  {
    index: '03',
    title: 'You cannot fake cardio.',
    body: 'Technical knowledge without conditioning fails under stress. Mental models without execution fail under pressure. Fitness is the foundation that makes everything else work.',
  },
  {
    index: '04',
    title: 'The tap resets everything.',
    body: 'There is no ego on the mat. Acknowledging a mistake instantly, learning from it, and re-engaging — this is the skill that separates growth from stagnation.',
  },
];

export default function FitnessPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <PageHero
        eyebrow="Fitness"
        eyebrowIndex="05"
        title={<>The mat is<br />a laboratory.</>}
        image="/images/photo-3wun-BJJ.jpg"
        imageAlt="Anibal training Brazilian Jiu-Jitsu"
        lede="Eight years of jiu-jitsu. The only room where nothing performs."
      />

      <StatsRow stats={STATS} />

      <div className="container-content">
        <div className="hairline" />
      </div>

      <section className="container-content section">
        <Reveal>
          <Eyebrow index="·">Principles</Eyebrow>
          <h2 className="h2 mt-6 mb-16" style={{ maxWidth: '20ch' }}>
            What the mat keeps teaching me.
          </h2>
        </Reveal>

        <div className="flex flex-col">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div
                className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 py-12"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="md:col-span-2">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 300,
                      fontSize: 'clamp(2rem, 4vw, 3rem)',
                      color: 'var(--gold)',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {p.index}
                  </span>
                </div>
                <div className="md:col-span-10">
                  <h3 className="h3 mb-5" style={{ maxWidth: '24ch' }}>{p.title}</h3>
                  <p className="body-lg" style={{ maxWidth: '64ch' }}>{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <div style={{ borderTop: '1px solid var(--border)' }} />
        </div>
      </section>

      <PullQuote attribution="On the mat">
        The body is the bow. The mind is the arrow.
      </PullQuote>

      <Footer />
    </main>
  );
}
