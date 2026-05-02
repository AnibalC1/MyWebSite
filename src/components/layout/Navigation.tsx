'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LogoSpin from '@/components/LogoSpin';

const NAV_LINKS = [
  { href: '/gallery', label: 'Gallery' },
  { href: '/videos', label: 'Videos' },
  { href: '/memory-atlas', label: 'Atlas' },
  { href: '/about', label: 'About' },
  { href: '/builds', label: 'Builds' },
  { href: '/fitness', label: 'Fitness' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      transition: 'background 0.7s, backdrop-filter 0.7s',
      background: scrolled ? 'rgba(10,10,11,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(201,168,76,0.1)' : 'none',
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.0rem 2.8rem',
        pointerEvents: 'auto',
      }}>
        <LogoSpin height={120} />

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.0rem' }} className=desktop-nav>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label=Toggle menu
          style={{
            display: 'none',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px',
            color: 'rgba(255,255,255,0.6)',
          }}
          className=mobile-menu-btn
        >
          <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ height: '1px', background: 'currentColor', display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ height: '1px', background: 'currentColor', display: 'block', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ height: '1px', background: 'currentColor', display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div style={{
          background: 'rgba(10,10,11,0.97)',
          borderTop: '1px solid rgba(201,168,76,0.1)',
          padding: '2rem 2.8rem',
          display: 'flex', flexDirection: 'column', gap: '1.6rem',
          pointerEvents: 'auto',
        }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: '1.6rem',
                color: 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
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
