import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateSitemap } from '../utils/sitemap';
import { createClient } from '@supabase/supabase-js';
import { BlogPost } from '../types';
import { generateUniqueSlug } from '../utils/slug';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let posts: BlogPost[] = [];
    
    // Tenta buscar posts do Supabase (se configurado)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          posts = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            excerpt: row.excerpt,
            content: row.content,
            category: row.category,
            author: row.author,
            date: row.date || new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            imageUrl: row.image_url || '',
            slug: row.slug || generateUniqueSlug(row.title, row.id)
          }));
        }
      } catch (supabaseError) {
        console.warn('Erro ao buscar posts do Supabase:', supabaseError);
        // Continua com array vazio
      }
    }
    
    // Gera o sitemap XML (mesmo se não houver posts, inclui páginas principais)
    const sitemap = generateSitemap(posts);
    
    // Define o tipo de conteúdo como XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    return res.status(200).send(sitemap);
  } catch (error: any) {
    console.error('Erro ao gerar sitemap:', error);
    
    // Em caso de erro, retorna um sitemap básico
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://botanicmd.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://botanicmd.com/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(fallbackSitemap);
  }
}

