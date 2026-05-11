'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Eyebrow from './Eyebrow';

type Props = {
  eyebrow: string;
  eyebrowIndex?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  variant?: 'image' | 'text';
  align?: 'left' | 'center';
  cta?: React.ReactNode;
};

export default function PageHero({
  eyebrow,
  eyebrowIndex,
  title,
  lede,
  image,
  imageAlt = '',
  variant,
  align = 'left',
  cta,
}: Props) {
  const mode = variant ?? (image ? 'image' : 'text');

  if (mode === 'image' && image) {
    return (
      <section className="relative overflow-hidden" style={{ height: 'min(86vh, 840px)' }}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          className="object-cover object-center"
          style={{ filter: 'brightness(0.5) saturate(0.9)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 25%, rgba(201,168,76,0.10) 0%, transparent 55%), linear-gradient(to bottom, rgba(10,10,11,0.45) 0%, transparent 30%, rgba(10,10,11,0.4) 65%, var(--obsidian) 100%)',
          }}
        />
        <div className="scanlines absolute inset-0 pointer-events-none opacity-50" />

        <div className="absolute bottom-0 left-0 right-0 z-10 container-wide pb-20">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={align === 'center' ? 'text-center mx-auto max-w-3xl' : ''}
          >
            <div className="mb-6">
              <Eyebrow index={eyebrowIndex}>{eyebrow}</Eyebrow>
            </div>
            <h1 className="display">{title}</h1>
            {lede && (
              <p className="lede mt-8 max-w-[58ch]" style={align === 'center' ? { marginInline: 'auto' } : undefined}>
                {lede}
              </p>
            )}
            {cta && <div className="mt-10">{cta}</div>}
          </motion.div>
        </div>
      </section>
    );
  }

  // Text variant
  return (
    <section className="container-wide pt-40 pb-16 md:pt-48 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={align === 'center' ? 'text-center mx-auto max-w-3xl' : 'max-w-4xl'}
      >
        <div className="mb-6">
          <Eyebrow index={eyebrowIndex}>{eyebrow}</Eyebrow>
        </div>
        <h1 className="h1">{title}</h1>
        {lede && (
          <p className="lede mt-8 max-w-[58ch]" style={align === 'center' ? { marginInline: 'auto' } : undefined}>
            {lede}
          </p>
        )}
        {cta && <div className="mt-10">{cta}</div>}
      </motion.div>
    </section>
  );
}
