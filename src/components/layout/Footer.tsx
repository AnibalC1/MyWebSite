'use client';

import Link from 'next/link';

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
        background: 'var(--obsidian-deep)',
        borderTop: '1px solid var(--border)',
        position: 'relative',
      }}
    >
      <div className="container-wide" style={{ paddingBlock: 'clamp(5rem, 9vw, 7rem)' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          {/* Brand + Newsletter */}
          <div className="md:col-span-6 lg:col-span-5">
            <span className="eyebrow eyebrow--plain" style={{ marginBottom: '1.25rem', display: 'block' }}>
              Anibal Cabral
            </span>
            <p
              className="h2"
              style={{
                fontSize: 'clamp(1.6rem, 2.6vw + 0.4rem, 2.4rem)',
                lineHeight: 1.18,
                marginBottom: '1.25rem',
                maxWidth: '22ch',
              }}
            >
              Systems built deliberately. Words worth keeping.
            </p>
            <p className="body" style={{ maxWidth: '40ch', marginBottom: '2.25rem' }}>
              A monthly letter on engineering, leadership, and living deliberately. No hype, no growth hacks.
            </p>

            <form
              action="https://buttondown.email/api/emails/embed-subscribe/anibalcabral"
              method="post"
              target="_blank"
              className="flex flex-col gap-3 max-w-[440px]"
              onSubmit={(e) => {
                const form = e.currentTarget;
                const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
                if (!email || !email.includes('@')) {
                  e.preventDefault();
                  alert('Please enter a valid email');
                }
              }}
            >
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="field"
                  style={{ flex: 1, fontSize: '0.85rem', padding: '12px 14px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.4rem', fontSize: '0.62rem' }}>
                  Join
                </button>
              </div>
            </form>
          </div>

          {/* Sitemap */}
          <div className="md:col-span-3 md:col-start-8 lg:col-start-9">
            <span className="eyebrow eyebrow--plain" style={{ marginBottom: '1.5rem', display: 'block' }}>
              Explore
            </span>
            <ul className="flex flex-col gap-3">
              {SITEMAP.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="link-inline" style={{ fontSize: '0.9rem' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="md:col-span-3 lg:col-span-3">
            <span className="eyebrow eyebrow--plain" style={{ marginBottom: '1.5rem', display: 'block' }}>
              Connect
            </span>
            <ul className="flex flex-col gap-3">
              {SOCIALS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-inline"
                    style={{ fontSize: '0.9rem', display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}
                  >
                    {label}
                    <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="caption" style={{ letterSpacing: '0.08em' }}>
            © {new Date().getFullYear()} Anibal Cabral · Built with intention
          </p>
          <p
            className="caption"
            style={{
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              color: 'var(--gold-subtle)',
            }}
          >
            Systems over hype
          </p>
        </div>
      </div>
    </footer>
  );
}
