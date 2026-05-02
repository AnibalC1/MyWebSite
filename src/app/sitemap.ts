import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://anibalcabral.com'

  const routes = [
    '',
    '/about',
    '/blog',
    '/builds',
    '/contact',
    '/fitness',
    '/gallery',
    '/memory-atlas',
    '/videos',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/blog' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/about' ? 0.9 : 0.7,
  }))
}
