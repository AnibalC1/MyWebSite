import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Anibal Cabral — Systems Builder, Father, Martial Artist',
    template: '%s | Anibal Cabral',
  },
  description: 'Systems builder. Father. BJJ practitioner. Entrepreneur. Building things that matter — one discipline at a time.',
  keywords: ['systems', 'BJJ', 'entrepreneur', 'builder', 'discipline', 'Anibal Cabral'],
  authors: [{ name: 'Anibal Cabral' }],
  creator: 'Anibal Cabral',
  metadataBase: new URL('https://my-web-site-delta-three.vercel.app'),
  openGraph: {
    title: 'Anibal Cabral',
    description: 'Systems builder. Father. BJJ practitioner. Entrepreneur.',
    type: 'website',
    siteName: 'Anibal Cabral',
    locale: 'en_US',
    images: [
      {
        url: '/logo.png',
        width: 772,
        height: 1340,
        alt: 'Anibal Cabral',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anibal Cabral',
    description: 'Systems builder. Father. BJJ practitioner. Entrepreneur.',
    creator: '@anibalcabral',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
  alternates: {
    canonical: 'https://my-web-site-delta-three.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Anibal Cabral',
              description: 'Systems builder, father, and martial artist.',
              url: 'https://my-web-site-delta-three.vercel.app',
              sameAs: [
                'https://github.com/AnibalC1',
                'https://linkedin.com/in/anibalcabral',
                'https://twitter.com/anibalcabral',
              ],
              jobTitle: 'Systems Builder & Entrepreneur',
              knowsAbout: ['Systems Engineering', 'BJJ', 'Entrepreneurship', 'Software Development'],
            }),
          }}
        />
      </head>
      <body className="bg-[var(--obsidian)] text-[var(--warm-white)] antialiased">
        {children}
      </body>
    </html>
  );
}
