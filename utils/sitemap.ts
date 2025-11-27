import { BlogPost } from '../types';
import { generateUniqueSlug } from './slug';

/**
 * Gera um sitemap XML dinâmico incluindo todos os posts do blog
 */
export function generateSitemap(posts: BlogPost[]): string {
  const baseUrl = 'https://botanicmd.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const urls = [
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '1.0'
    },
    {
      loc: `${baseUrl}/app`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      loc: `${baseUrl}/blog`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.8'
    },
    {
      loc: `${baseUrl}/privacy`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.5'
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.5'
    },
    // Adiciona URLs dos posts
    ...posts.map(post => {
      const slug = post.slug || generateUniqueSlug(post.title, post.id);
      // Tenta extrair a data do post para lastmod
      let lastmod = currentDate;
      try {
        // Tenta parsear a data do formato "Oct 12, 2024"
        const dateMatch = post.date.match(/(\w+)\s+(\d+),\s+(\d+)/);
        if (dateMatch) {
          const [, month, day, year] = dateMatch;
          const monthMap: { [key: string]: string } = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          const monthNum = monthMap[month] || '01';
          lastmod = `${year}-${monthNum}-${day.padStart(2, '0')}`;
        }
      } catch (e) {
        // Se falhar, usa a data atual
      }

      return {
        loc: `${baseUrl}/blog/${slug}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.7'
      };
    })
  ];

  const urlElements = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
}

