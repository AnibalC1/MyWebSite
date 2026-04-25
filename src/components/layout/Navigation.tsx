'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/gallery', label: 'Gallery' },
  { href: '/videos',  label: 'Videos'  },
  { href: '/about',   label: 'About'   },
  { href: '/builds',  label: 'Builds'  },
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
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.7s',
        background: scrolled ? 'rgba(10,10,11,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,168,76,0.1)' : 'none',
      }}
    >
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '0 2rem',
        height: '72px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Spinning logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', height: '60px', display: 'inline-block' }}>
            <img
              src="/logo.png"
              alt=""
              aria-hidden
              className="logo-inner-spin"
              style={{
                position: 'absolute', top: 0, left: 0,
                height: '60px', width: 'auto',
                clipPath: 'circle(21% at 50% 46%)',
                filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.9))',
              }}
            />
            <img
              src="/logo.png"
              alt="Anibal Cabral"
              style={{
                height: '60px', width: 'auto',
                position: 'relative', zIndex: 1,
                filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.4))',
                WebkitMaskImage: 'radial-gradient(circle 21% at 50% 46%, transparent 95%, black 100%)',
                maskImage: 'radial-gradient(circle 21% at 50% 46%, transparent 95%, black 100%)',
              }}
            />
          </div>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.2rem' }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '0.62rem',
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                textTransform: 'uppercase' as const,
                transition: 'color 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          background: 'rgba(10,10,11,0.97)',
          borderTop: '1px solid rgba(201,168,76,0.1)',
          padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
        }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '1.4rem',
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontStyle: 'italic',
              }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
