'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Reveal from '@/components/ui/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';
import PageHero from '@/components/ui/PageHero';
import StatsRow from '@/components/ui/StatsRow';
import PullQuote from '@/components/ui/PullQuote';

const STATS = [
  { value: '2', label: 'Children', desc: 'The standard by which every decision is measured.' },
  { value: '8+', label: 'Years on the Mat', desc: 'Brazilian Jiu-Jitsu is the honesty filter.' },
  { value: '3', label: 'Systems Live', desc: 'Production systems running 24/7 on-chain.' },
];

const SECTIONS: { eyebrow: string; index: string; title: string; body: string[] }[] = [
  {
    eyebrow: 'Opening',
    index: '01',
    title: 'I am not a finished thing.',
    body: [
      'I am a man in the middle of becoming — building systems, raising children, training my body, and learning, slowly, to align how I live with who I actually am.',
      'That work is never finished. That is the point.',
    ],
  },
  {
    eyebrow: 'Fatherhood',
    index: '02',
    title: 'I had to look at myself honestly.',
    body: [
      'There was a point where I had to look at myself honestly — not as a man with intentions, but as a father with a record.',
      'I saw what my reactions were doing. I saw the gap between who I thought I was and how I was actually showing up. Intention was not enough. Awareness without change is just self-flattery.',
      'So I started the work. Not because I had it figured out — but because I could not pretend I did not see it anymore. That moment changed everything.',
    ],
  },
  {
    eyebrow: 'Son',
    index: '03',
    title: 'He needed me to respect his path.',
    body: [
      'My son made decisions I did not agree with. Choices I would not have made. A path I did not choose for him.',
      'For a long time, I thought that meant something was wrong.',
      'Looking back, I understand it differently. He did not need me to control his path. He needed me to respect it. To trust that who he is matters more than who I imagined he should be.',
      'That is a harder lesson than anything I have learned in a room.',
    ],
  },
  {
    eyebrow: 'Daughter',
    index: '04',
    title: 'She did not get the version still figuring it out.',
    body: [
      'By the time my daughter was born, I was not the same man.',
      'I had already started the work — learning how to listen without defending, how to be present without performing, how to create stability instead of reacting to chaos.',
      'She did not get the version of me that was still figuring it out. She got the version that had already started to change. That matters to me more than I can explain.',
    ],
  },
  {
    eyebrow: 'BJJ',
    index: '05',
    title: 'On the mat, nothing performs.',
    body: [
      'I train jiu-jitsu. Have for years.',
      'Most things in life can be faked — status, confidence, knowledge. On the mat, none of that holds. You either know the technique or you do not. You are either calm under pressure or you are not.',
      'Jiu-jitsu is one of the few places where nothing performs. It forces honesty — about your limits, your reactions, and your mind under pressure. That is why I keep coming back.',
    ],
  },
  {
    eyebrow: 'Work',
    index: '06',
    title: 'I was seeing patterns.',
    body: [
      'I have spent years working in technology — infrastructure, systems, operations. But over time I realized that what I was actually doing was not technical.',
      'I was seeing patterns.',
      'The same broken dynamics that exist in a failing IT system exist in a failing organization. In a relationship. In a person who will not examine themselves. Once you learn to see the structure underneath the surface, you cannot unsee it.',
      'That is how I approach most things now. Not as problems to fix — but as systems to understand.',
    ],
  },
  {
    eyebrow: 'Present',
    index: '07',
    title: 'The standard. Everything else is details.',
    body: [
      'Right now I am building — AI systems, digital experiences, a book, a life that actually connects. Not to prove something. Not to perform.',
      'To understand and refine who I am becoming. To leave something behind that reflects how I actually think, not just what I accomplished.',
      'The projects matter. The work matters. But underneath all of it is one question I keep asking:',
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <PageHero
        eyebrow="About"
        eyebrowIndex="01"
        title={<>Anibal<br />Cabral</>}
        image="/images/photo-oq31-family-selfie.jpg"
        imageAlt="Anibal Cabral with family"
        lede="Systems builder. Father of two. BJJ practitioner. Writing about engineering, leadership, and living deliberately."
      />

      <StatsRow stats={STATS} />

      <div className="container-content">
        <div className="hairline" />
      </div>

      {/* Prose */}
      <article className="container-content" style={{ paddingBlock: 'clamp(4rem, 8vw, 6rem)' }}>
        {SECTIONS.map((section, idx) => (
          <Reveal key={section.index} className="py-12 md:py-16">
            <div className="max-w-[68ch]">
              <div className="mb-6">
                <Eyebrow index={section.index}>{section.eyebrow}</Eyebrow>
              </div>
              <h2 className="h2 mb-8" style={{ maxWidth: '20ch' }}>
                {section.title}
              </h2>
              <div className="flex flex-col gap-6">
                {section.body.map((p, i) => (
                  <p key={i} className="body-lg">{p}</p>
                ))}
                {idx === SECTIONS.length - 1 && (
                  <>
                    <p className="h3 mt-4" style={{ color: 'var(--warm-white)' }}>
                      Am I becoming the person I want my children to have known?
                    </p>
                    <p className="body-lg">That is the standard. Everything else is details.</p>
                  </>
                )}
              </div>
            </div>

            {/* Inline image after Fatherhood section */}
            {idx === 1 && (
              <div className="mt-16 relative overflow-hidden" style={{ height: 'clamp(280px, 50vw, 460px)' }}>
                <Image
                  src="/images/photo-0afl-birthday-family.jpg"
                  alt="Anibal with family at a celebration"
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.78) saturate(0.95)' }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.5) 0%, transparent 60%)' }}
                />
              </div>
            )}
            {idx === 4 && (
              <div className="mt-16 relative overflow-hidden" style={{ height: 'clamp(320px, 56vw, 540px)' }}>
                <Image
                  src="/images/photo-3wun-BJJ.jpg"
                  alt="Anibal training jiu-jitsu"
                  fill
                  className="object-cover object-center"
                  style={{ filter: 'brightness(0.8) saturate(0.95)' }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.55) 0%, transparent 55%)' }}
                />
              </div>
            )}

            {idx < SECTIONS.length - 1 && <div className="hairline mt-16" />}
          </Reveal>
        ))}
      </article>

      <PullQuote>I become precise.</PullQuote>

      <section className="container-content section-tight">
        <div className="hairline mb-12" />
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-8 sm:items-center justify-between">
            <p className="body" style={{ maxWidth: '42ch' }}>
              I read everything. I reply to what matters.
            </p>
            <Link href="/contact" className="btn btn-secondary">
              Get in touch <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
