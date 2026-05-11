'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Reveal from '@/components/ui/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';

const POSTS: Record<string, {
  title: string;
  date: string;
  tag: string;
  readTime: string;
  content: string[];
}> = {
  'systems-thinking': {
    title: 'Why Systems Thinking Is the Only Competitive Advantage Left',
    date: '2026 — 04 — 15',
    tag: 'Strategy',
    readTime: '6 min read',
    content: [
      "We are drowning in tools. Every founder I know has access to the same AI models, the same cloud infrastructure, the same no-code builders. The playing field has never been more level — and that is precisely why systems thinking is the only edge that matters.",
      "A tool is a single lever. A system is a network of levers, connected by feedback loops, weighted by trade-offs, and tuned for compounding returns. The founder who thinks in systems does not just ship faster. She sees around corners. She builds machines that improve themselves.",
      "I learned this the hard way. In my first company, I optimized for speed. We shipped features weekly, chased every customer request, and celebrated our velocity. Six months later, the codebase was a graveyard of half-implemented ideas. Technical debt did not just slow us down — it changed what we could imagine. Debt is not just a cost. It is a cognitive tax.",
      "Systems thinking is the practice of seeing the whole board. It means mapping second-order effects before you touch the first. It means designing for maintenance at day zero. It means choosing the boring, robust solution over the exciting, fragile one — not because you lack ambition, but because your ambition is larger than any single sprint.",
      "The best engineers I hire today are not the fastest coders. They are the ones who draw diagrams before they write functions. They ask: what happens when this scales? What breaks when this assumption fails? Who suffers when this succeeds? These are systems questions, and they separate builders who last from builders who flame out.",
      "If you want a competitive advantage in 2026, stop collecting tools. Start architecting systems. The multiplier is not in what you use. It is in how you connect.",
    ],
  },
  'bjj-startup': {
    title: 'What Brazilian Jiu-Jitsu Taught Me About Building Companies',
    date: '2026 — 03 — 22',
    tag: 'Leadership',
    readTime: '8 min read',
    content: [
      "The first time I was choked unconscious in training, I learned something no business book could teach me: pressure reveals truth. On the mat, there is no pitch deck. There is no narrative. There is only position, leverage, and the consequences of your last decision. Jiu-Jitsu is a laboratory for leadership under duress.",
      "In BJJ, you learn to be comfortable with discomfort. Someone is trying to strangle you, and your job is to stay calm, protect your neck, and work toward a better position. The parallel to a startup in crisis is almost comical. Cash runway shrinking? Competitor just raised fifty million? Key engineer quit? Same feeling. Same requirement: protect the vital organs, breathe, and move.",
      "One concept that translates directly is posture. In Jiu-Jitsu, bad posture makes you light — easy to sweep, easy to submit. In business, bad posture means overextending for a deal, hiring out of desperation, or shipping a feature that violates your architecture. Good posture is expensive in the short term and priceless in the long term.",
      "Another is the hierarchy of positions. Mount is better than side control. Side control is better than guard. Guard is better than being mounted. Every business has a position hierarchy too. Product-market fit is mount. Early revenue with churn is guard. Burning cash without traction is being mounted. Know where you are. Do not pretend a good guard is mount.",
      "The most humbling lesson is that size matters less than technique — but technique takes years. I have been tapped by teenagers half my weight. They did not win because they were stronger. They won because they had invested more hours in the fundamentals. There is no shortcut to mat time. There is no shortcut to market time. You have to show up, get beaten, adjust, and return.",
      "Jiu-Jitsu also teaches you to tap. Ego is your enemy. If you refuse to tap, you go to sleep or your joint breaks. In business, refusing to pivot is the same. The founders who survive are not the most stubborn. They are the most committed to the mission and the most flexible about the method. Tap early, learn fast, come back sharper.",
      "The mat is unforgiving. So is the market. The difference is that on the mat, nobody believes your story. They only believe your pressure. Build companies the same way.",
    ],
  },
  'ai-automation': {
    title: 'The 10x Engineer Is Dead. Long Live the 10x System.',
    date: '2026 — 02 — 10',
    tag: 'Engineering',
    readTime: '5 min read',
    content: [
      "For a decade, we mythologized the 10x engineer. The lone genius who codes through the night, ships impossible features, and carries the team on their back. I have worked with a few. They are real. They are also dangerous, expensive, and increasingly irrelevant.",
      "The 10x engineer is a hero narrative. Hero narratives scale badly. When your critical path depends on one person's context, mood, and sleep schedule, you do not have an engineering organization. You have a cult of personality with a burnout schedule.",
      "What scales is the 10x system. A system where the architecture makes the right choice the easy choice. Where CI/CD catches errors before humans review them. Where documentation is not a chore but a byproduct of good abstractions. Where onboarding takes days, not months, because the codebase is legible.",
      "AI has accelerated this shift. The engineer who writes raw code all day is being outpaced by the engineer who orchestrates agents, curates prompts, and validates outputs. The new multiplier is not typing speed. It is system design. It is knowing which problems to automate, which to abstract, and which to eliminate entirely.",
      "I recently rebuilt our data pipeline. The old one was a Rube Goldberg machine of cron jobs, Python scripts, and prayer. The new one is three declarative configurations and a state machine. It handles ten times the volume with one-tenth the incidents. Nobody stayed up late writing it. Nobody is a hero for maintaining it. That is the point.",
      "Stop hiring for heroics. Start architecting for leverage. The best teams in 2026 are not collections of brilliant individuals. They are machines that make ordinary individuals brilliant. That is the 10x system.",
    ],
  },
  'fatherhood-focus': {
    title: 'Fatherhood Forced Me to Become Ruthless With My Time',
    date: '2026 — 01 — 05',
    tag: 'Life',
    readTime: '4 min read',
    content: [
      "My daughter does not care about my calendar. When she needs me, she needs me now. Not in twenty minutes. Not after this call. Now. That urgency has become the most valuable filter I have ever applied to my life.",
      "Before kids, I treated time as abundant. I said yes to coffee meetings, advisory roles, and side projects that sounded interesting. I optimized for optionality — keeping doors open, maintaining relationships, exploring possibilities. It felt productive. It was actually dilution.",
      "Fatherhood made time scarce. Scarcity forces clarity. Every hour I spend away from my children is an hour I have to justify. Not to them — they are too young to judge. To myself. Is this meeting moving the mission forward? Is this project aligned with my core competence? Is this relationship additive or habitual?",
      "The result has been a brutal pruning. I dropped three advisory boards. I stopped attending conferences unless I am speaking. I reduced my weekly meetings from twenty to six. My output did not decrease. It increased. Because the work that survived the filter was the work that mattered.",
      "There is a psychological principle here: constraints breed creativity. When you have eight uninterrupted hours, you fill them with busyness. When you have three, you fill them with impact. Parenthood is the ultimate constraint, and it has made me a better founder, a better engineer, and a better human.",
      "My kids do not negotiate. They demand presence. And that demand has become the standard I hold every other commitment against. If it does not survive the fatherhood filter, it does not deserve my time.",
    ],
  },
};

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const post = POSTS[slug];

  if (!post) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
        <Navigation />
        <div className="container-content pt-48 pb-32 text-center">
          <Eyebrow plain>404</Eyebrow>
          <h1 className="h1 mt-6 mb-10">Post not found.</h1>
          <Link href="/blog" className="btn btn-secondary">
            <span aria-hidden>←</span> Back to essays
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <article className="container-prose pt-40 pb-24 md:pt-48">
        <Reveal>
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <span className="tag">{post.tag}</span>
            <span className="caption" style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              {post.date} · {post.readTime}
            </span>
          </div>

          <h1 className="h1 mb-12" style={{ maxWidth: '26ch' }}>
            {post.title}
          </h1>

          <div className="hairline mb-12" />
        </Reveal>

        <div className="flex flex-col gap-7">
          {post.content.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <p className="body-lg">{paragraph}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-20 pt-10" style={{ borderTop: '1px solid var(--border)' }}>
            <Link href="/blog" className="btn btn-secondary">
              <span aria-hidden>←</span> All essays
            </Link>
          </div>
        </Reveal>
      </article>

      <Footer />
    </main>
  );
}
