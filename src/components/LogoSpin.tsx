'use client';
import Link from 'next/link';

interface LogoSpinProps {
  height?: number;
}

export default function LogoSpin({ height = 120 }: LogoSpinProps) {
  const clip = 'circle(21% at 50% 46%)';
  const mask = 'radial-gradient(circle 21% at 50% 46%, transparent 95%, black 100%)';
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <div style={{ position: 'relative', height: `${height}px`, display: 'inline-block', flexShrink: 0 }}>
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="logo-inner-spin"
          style={{
            position: 'absolute', top: 0, left: 0,
            height: `${height}px`, width: 'auto',
            clipPath: clip,
            filter: 'drop-shadow(0 0 14px rgba(201,168,76,0.9))',
          }}
        />
        <img
          src="/logo.png"
          alt="Anibal Cabral"
          style={{
            height: `${height}px`, width: 'auto',
            position: 'relative', zIndex: 1,
            filter: 'drop-shadow(0 0 10px rgba(201,168,76,0.5))',
            WebkitMaskImage: mask,
            maskImage: mask,
          }}
        />
      </div>
    </Link>
  );
}
