'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(201,168,76,0.08)', background: 'var(--obsidian)' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="grid gap-12" style={{ gridTemplateColumns: '1fr auto' }}>
          <div>
            <p
              className="text-lg italic font-light mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)' }}
            >
              Systems that scale. Craft that endures.
            </p>
            <p className="text-sm" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', maxWidth: '360px' }}>
              Building at the intersection of engineering, leadership, and deliberate living.
              Father of two. Brazilian Jiu-Jitsu practitioner.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--steel)', fontFamily: 'var(--font-body)' }}>
                Navigate
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/gallery', label: 'Gallery' },
                  { href: '/videos', label: 'Videos' },
                  { href: '/about', label: 'About' },
                  { href: '/blog', label: 'Blog' },
                  { href: '/fitness', label: 'Fitness' },
                  { href: '/builds', label: 'Builds' },
                  { href: '/contact', label: 'Contact' },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm transition-colors duration-300 hover:text-[var(--gold)]"
                    style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--steel)', fontFamily: 'var(--font-body)' }}>
                Connect
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com/AnibalC1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors duration-300 hover:text-[var(--gold)]"
                  style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                >
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/anibalcabral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors duration-300 hover:text-[var(--gold)]"
                  style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                >
                  LinkedIn
                </a>
                <a
                  href="https://twitter.com/anibalcabral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors duration-300 hover:text-[var(--gold)]"
                  style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
                >
                  Twitter / X
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-16 pt-8 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(201,168,76,0.06)' }}
        >
          <p className="text-[0.6rem] tracking-[0.15em] uppercase" style={{ color: 'var(--steel)', fontFamily: 'var(--font-body)' }}>
            © {new Date().getFullYear()} Anibal Cabral
          </p>
          <p className="text-[0.6rem] tracking-[0.15em] uppercase" style={{ color: 'var(--steel)', fontFamily: 'var(--font-body)' }}>
            Built with deliberation
          </p>
        </div>
      </div>
    </footer>
  )
}
