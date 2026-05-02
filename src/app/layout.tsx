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
  title: 'Anibal Cabral — Systems Builder, Father, BJJ Practitioner',
  description: 'Anibal Cabral builds systems that scale. Father of two. Brazilian Jiu-Jitsu practitioner. Entrepreneur. Writing about engineering, leadership, and living deliberately.',
  keywords: ['Anibal Cabral', 'systems builder', 'BJJ', 'entrepreneur', 'software engineer', 'leadership', 'Brazilian Jiu-Jitsu'],
  authors: [{ name: 'Anibal Cabral' }],
  creator: 'Anibal Cabral',
  metadataBase: new URL('https://anibalcabral.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Anibal Cabral — Systems Builder, Father, BJJ Practitioner',
    description: 'Building systems that scale. Writing about engineering, leadership, and living deliberately.',
    type: 'website',
    locale: 'en_US',
    url: 'https://anibalcabral.com',
    siteName: 'Anibal Cabral',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Anibal Cabral — Systems Builder',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anibal Cabral — Systems Builder',
    description: 'Building systems that scale. Father. BJJ practitioner. Entrepreneur.',
    images: ['/og-image.jpg'],
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
    google: 'YOUR_GOOGLE_VERIFICATION',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Anibal Cabral',
              url: 'https://anibalcabral.com',
              sameAs: [
                'https://github.com/AnibalC1',
                'https://linkedin.com/in/anibalcabral',
              ],
              jobTitle: 'Systems Builder & Entrepreneur',
              description: 'Building systems that scale. Father. BJJ practitioner.',
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
