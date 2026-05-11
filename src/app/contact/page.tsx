'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/ui/PageHero';
import Eyebrow from '@/components/ui/Eyebrow';

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/AnibalC1' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/anibalcabral' },
  { label: 'YouTube', href: 'https://youtube.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '', _hp: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form._hp) return;
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <PageHero
        eyebrow="Contact"
        eyebrowIndex="07"
        title="Get in touch."
        lede="I read everything. I reply to what matters."
      />

      <section className="container-content" style={{ paddingBottom: 'clamp(4rem, 8vw, 6rem)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Form */}
          <div className="lg:col-span-7">
            <div className="hairline mb-12" />
            {state === 'sent' ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12"
              >
                <Eyebrow plain>Received</Eyebrow>
                <p className="h2 mt-6">I will be in touch.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <input
                  type="text"
                  name="_hp"
                  value={form._hp}
                  onChange={e => setForm(f => ({ ...f, _hp: e.target.value }))}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div>
                  <label className="caption block mb-2" style={{ letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="field"
                  />
                </div>

                <div>
                  <label className="caption block mb-2" style={{ letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="field"
                  />
                </div>

                <div>
                  <label className="caption block mb-2" style={{ letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                    Message
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="field"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {state === 'error' && (
                  <p className="caption" style={{ color: '#c97e7e' }}>
                    Something went wrong. Try again or{' '}
                    <a href="mailto:anibal.cabral.ac@gmail.com" className="underline">
                      email directly
                    </a>.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="btn btn-primary mt-4 self-start"
                  style={{
                    opacity: state === 'sending' ? 0.5 : 1,
                    cursor: state === 'sending' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state === 'sending' ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-5">
            <div className="hairline mb-12" />
            <div className="mb-12">
              <Eyebrow index="·">Direct line</Eyebrow>
              <a
                href="mailto:anibal.cabral.ac@gmail.com"
                className="link-inline mt-5 block"
                style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.2rem, 2vw, 1.6rem)' }}
              >
                anibal.cabral.ac@gmail.com
                <span style={{ marginLeft: '0.4rem', opacity: 0.5, fontSize: '0.8rem' }}>↗</span>
              </a>
            </div>

            <div className="hairline mb-12" />
            <div>
              <Eyebrow index="·">Elsewhere</Eyebrow>
              <ul className="mt-5 flex flex-col gap-3">
                {SOCIALS.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-inline"
                      style={{ fontSize: '0.95rem', display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}
                    >
                      {label}
                      <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
