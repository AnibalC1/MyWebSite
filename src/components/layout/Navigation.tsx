'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoSpin from '@/components/LogoSpin';

const NAV_LINKS = [
  { href: '/gallery', label: 'Gallery' },
  { href: '/videos',  label: 'Videos'  },
  { href: '/about',   label: 'About'   },
  { href: '/blog',    label: 'Blog'    },
  { href: '/fitness', label: 'Fitness' },
  { href: '/builds',  label: 'Builds'  },
  { href: '/contact', label: 'Contact' },
];

type Props = {
  /** Force transparent until scroll (use over hero video). Defaults to true. */
  transparent?: boolean;
  /** Pin logo larger on home only */
  large?: boolean;
};

export default function Navigation({ transparent = true, large = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const opaque = !transparent || scrolled;

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 600ms var(--ease-luxury), backdrop-filter 600ms, border-color 600ms',
        background: opaque ? 'rgba(10,10,11,0.78)' : 'transparent',
        backdropFilter: opaque ? 'blur(14px) saturate(120%)' : 'none',
        WebkitBackdropFilter: opaque ? 'blur(14px) saturate(120%)' : 'none',
        borderBottom: opaque ? '1px solid var(--border)' : '1px solid transparent',
        pointerEvents: 'none',
      }}
    >
      <div
        className="container-wide"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBlock: large ? '1.1rem' : '0.85rem',
          pointerEvents: 'auto',
        }}
      >
        <LogoSpin height={large ? 120 : 96} />

        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2.2rem' }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  position: 'relative',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.24em',
                  color: active ? 'var(--gold)' : 'rgba(241,237,230,0.55)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'color 300ms var(--ease-luxury)',
                  paddingBlock: '0.4rem',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = active ? 'var(--gold)' : 'rgba(241,237,230,0.55)')}
              >
                {label}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0, right: 0, bottom: 0,
                      height: '1px',
                      background: 'var(--gold)',
                      opacity: 0.6,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="mobile-menu-btn"
          style={{
            display: 'none',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px',
            color: 'rgba(241,237,230,0.7)',
          }}
        >
          <div style={{ width: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ height: '1px', background: 'currentColor', display: 'block', transition: 'all 300ms', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ height: '1px', background: 'currentColor', display: 'block', transition: 'all 300ms', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ height: '1px', background: 'currentColor', display: 'block', transition: 'all 300ms', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div
          style={{
            background: 'rgba(10,10,11,0.97)',
            borderTop: '1px solid var(--border)',
            padding: '2rem 2.4rem 2.6rem',
            display: 'flex', flexDirection: 'column', gap: '1.4rem',
            pointerEvents: 'auto',
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '1.8rem',
                color: pathname === href ? 'var(--gold)' : 'rgba(241,237,230,0.85)',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
