'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '', _hp: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form._hp) return
    setState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--graphite)',
    border: '1px solid var(--steel)',
    color: 'var(--warm-white)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    padding: '14px 16px',
    outline: 'none',
    transition: 'border-color 200ms',
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <Navigation />

      <div className="max-w-[640px] mx-auto px-6 pt-40 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[0.6875rem] tracking-[0.35em] uppercase mb-5" style={{ color: '#4a4845', fontFamily: 'var(--font-body)' }}>
            Contact
          </p>
          <h1
            className="font-light leading-[0.9] tracking-[-0.03em] mb-8"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warm-white)', fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          >
            Get in Touch
          </h1>
          <p className="text-base leading-relaxed mb-16" style={{ color: 'var(--warm-white-muted)', fontFamily: 'var(--font-body)' }}>
            I read everything. I reply to what matters.
          </p>

          {state === 'sent' ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12"
              style={{ color: 'var(--warm-white)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem' }}
            >
              Received. I will be in touch.
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Honeypot */}
              <input
                type="text"
                name="_hp"
                value={form._hp}
                onChange={e => setForm(f => ({ ...f, _hp: e.target.value }))}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <input
                type="text"
                placeholder="Name"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
              />
              <textarea
                placeholder="Message"
                required
                rows={6}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />

              {state === 'error' && (
                <p className="text-sm" style={{ color: '#c97e7e', fontFamily: 'var(--font-body)' }}>
                  Something went wrong. Try again or{' '}
                  <a
                    href="mailto:anibal.cabral.ac@gmail.com"
                    className="underline hover:opacity-80 transition-opacity"
                    style={{ color: '#c97e7e' }}
                  >
                    email directly
                  </a>.
                </p>
              )}

              <button
                type="submit"
                disabled={state === 'sending'}
                className="mt-2 text-sm uppercase tracking-widest px-8 py-4 transition-all duration-200"
                style={{
                  background: state === 'sending' ? 'transparent' : 'var(--gold)',
                  color: state === 'sending' ? 'var(--warm-white-muted)' : 'var(--obsidian)',
                  border: '1px solid var(--gold)',
                  fontFamily: 'var(--font-body)',
                  cursor: state === 'sending' ? 'not-allowed' : 'pointer',
                  opacity: state === 'sending' ? 0.6 : 1,
                }}
              >
                {state === 'sending' ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Social links */}
        <div className="mt-24 pt-12" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p
            className="text-[0.6rem] uppercase tracking-[0.2em] mb-6"
            style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}
          >
            Or find me here
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { label: 'GitHub', href: 'https://github.com/AnibalC1' },
              { label: 'LinkedIn', href: 'https://linkedin.com/in/anibalcabral' },
              { label: 'YouTube', href: 'https://youtube.com' },
              { label: 'Instagram', href: 'https://instagram.com' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors duration-200"
                style={{
                  color: 'var(--warm-white-muted)',
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--warm-white-muted)')}
              >
                {label}
                <span className="ml-1" style={{ fontSize: '0.75rem', opacity: 0.5 }}>↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Direct email */}
        <div className="mt-16 pt-12" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p
            className="text-[0.6rem] uppercase tracking-[0.2em] mb-4"
            style={{ color: 'var(--gold-subtle)', fontFamily: 'var(--font-body)' }}
          >
            Or write directly
          </p>
          <a
            href="mailto:anibal.cabral.ac@gmail.com"
            className="text-base transition-colors duration-200"
            style={{
              color: 'var(--warm-white-muted)',
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--warm-white-muted)')}
          >
            anibal.cabral.ac@gmail.com
            <span className="ml-2" style={{ fontSize: '0.85rem', opacity: 0.5 }}>↗</span>
          </a>
        </div>
      </div>
      <Footer />
    </main>
  )
}
