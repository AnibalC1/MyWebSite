'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const SITEMAP = [
  { label: 'Gallery', href: '/gallery' },
  { label: 'Videos', href: '/videos' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Fitness', href: '/fitness' },
  { label: 'Builds', href: '/builds' },
  { label: 'Contact', href: '/contact' },
];

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/AnibalC1' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/anibalcabral' },
  { label: 'YouTube', href: 'https://youtube.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--obsidian)',
        borderTop: '1px solid rgba(201,168,76,0.08)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          {/* Brand + Newsletter */}
          <div className="md:col-span-5">
            <p
              className="font-light tracking-[-0.02em] mb-4"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                color: 'var(--warm-white)',
              }}
            >
              Anibal Cabral
            </p>
            <p
              className="text-sm leading-relaxed mb-8 max-w-[36ch]"
              style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}
            >
              Systems builder. Father. BJJ practitioner. Writing about engineering, leadership, and living deliberately.
            </p>

            {/* Newsletter — Buttondown */}
            <form
              action="https://buttondown.email/api/emails/embed-subscribe/anibalcabral"
              method="post"
              target="_blank"
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                const form = e.currentTarget;
                const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
                if (!email || !email.includes('@')) {
                  e.preventDefault();
                  alert('Please enter a valid email');
                }
              }}
            >
              <p
                className="text-[0.6rem] uppercase tracking-[0.2em]"
                style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}
              >
                Newsletter
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="flex-1"
                  style={{
                    background: 'var(--graphite)',
                    border: '1px solid var(--steel)',
                    color: 'var(--warm-white)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                    padding: '12px 14px',
                    outline: 'none',
                    transition: 'border-color 200ms',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-subtle)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--steel)')}
                />
                <button
                  type="submit"
                  className="text-[0.65rem] uppercase tracking-[0.15em] px-5 py-3 transition-all duration-200"
                  style={{
                    background: 'var(--gold)',
                    color: 'var(--obsidian)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#b8975e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--gold)';
                  }}
                >
                  Join
                </button>
              </div>
            </form>
          </div>

          {/* Sitemap */}
          <div className="md:col-span-3 md:col-start-7">
            <p
              className="text-[0.6rem] uppercase tracking-[0.2em] mb-6"
              style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}
            >
              Explore
            </p>
            <ul className="flex flex-col gap-3">
              {SITEMAP.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors duration-200"
                    style={{
                      color: 'var(--warm-white-muted)',
                      fontFamily: 'var(--font-body)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--gold)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--warm-white-muted)')
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="md:col-span-3">
            <p
              className="text-[0.6rem] uppercase tracking-[0.2em] mb-6"
              style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}
            >
              Connect
            </p>
            <ul className="flex flex-col gap-3">
              {SOCIALS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-colors duration-200"
                    style={{
                      color: 'var(--warm-white-muted)',
                      fontFamily: 'var(--font-body)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--gold)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--warm-white-muted)')
                    }
                  >
                    {label}
                    <span className="ml-1" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-24 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(201,168,76,0.06)' }}
        >
          <p
            className="text-[0.65rem] tracking-[0.1em]"
            style={{ color: 'var(--steel-light)', fontFamily: 'var(--font-body)' }}
          >
            © {new Date().getFullYear()} Anibal Cabral. Built with intention.
          </p>
          <p
            className="text-[0.6rem] tracking-[0.1em] uppercase"
            style={{ color: 'var(--steel-light)', fontFamily: 'var(--font-body)' }}
          >
            Systems over hype
          </p>
        </div>
      </div>
    </footer>
  );
}
