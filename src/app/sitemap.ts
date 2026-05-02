import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://my-web-site-delta-three.vercel.app';
  
  const routes = [
    '',
    '/about',
    '/gallery',
    '/videos',
    '/memory-atlas',
    '/builds',
    '/fitness',
    '/blog',
    '/contact',
  ];

  return routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));
}
