'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/videos', label: 'Videos' },
  { href: '/memory-atlas', label: 'Memory Atlas' },
  { href: '/builds', label: 'Builds' },
  { href: '/fitness', label: 'Fitness' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--obsidian)', borderTop: '1px solid var(--steel)' }}>
      <div className=max-w-[1280px] mx-auto px-6 py-20>
        <div className=grid grid-cols-1 md:grid-cols-3 gap-12>
          {/* Brand */}
          <div>
            <p
              className=text-2xl font-light italic mb-4
              style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
            >
              Anibal Cabral
            </p>
            <p className=text-sm leading-relaxed style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', maxWidth: '28ch' }}>
              Systems builder. Father. Martial artist. Building things that matter.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className=text-[0.6rem] uppercase tracking-widest mb-6 style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>
              Navigation
            </p>
            <div className=flex flex-col gap-3>
              {FOOTER_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className=text-sm transition-colors duration-200 hover:text-[#c9a84c]
                  style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <p className=text-[0.6rem] uppercase tracking-widest mb-6 style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>
              Stay Updated
            </p>
            <p className=text-sm mb-4 style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', maxWidth: '32ch' }}>
              I write about systems, discipline, and what I am building. No noise. Only signal.
            </p>
            <form
              action=https://buttondown.email/api/emails/embed-subscribe/anibalcabral
              method=post
              target=popupwindow
              onSubmit={() => { window.open('https://buttondown.email/anibalcabral', 'popupwindow'); }}
              className=flex gap-2
            >
              <input
                type=email
                name=email
                placeholder=your@email.com
                required
                className=flex-1 px-4 py-3 text-sm
                style={{
                  background: 'var(--graphite)',
                  border: '1px solid var(--steel)',
                  color: 'var(--warm-white)',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
              />
              <button
                type=submit
                className=px-5 py-3 text-sm uppercase tracking-widest transition-all duration-200
                style={{
                  background: 'var(--gold)',
                  color: 'var(--obsidian)',
                  fontFamily: 'var(--font-body)',
                  border: '1px solid var(--gold)',
                }}
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className=mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 style={{ borderTop: '1px solid var(--steel)' }}>
          <p className=text-xs style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            © {new Date().getFullYear()} Anibal Cabral. All rights reserved.
          </p>
          <div className=flex gap-6>
            {[
              { label: 'GitHub', href: 'https://github.com/AnibalC1' },
              { label: 'LinkedIn', href: 'https://linkedin.com/in/anibalcabral' },
              { label: 'Twitter', href: 'https://twitter.com/anibalcabral' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target=_blank
                rel=noopener noreferrer
                className=text-xs uppercase tracking-widest transition-colors duration-200 hover:text-[#c9a84c]
                style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
