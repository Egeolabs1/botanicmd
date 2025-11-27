/**
 * Script para testar se os slugs estão funcionando
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
function loadEnv() {
  const env = {};
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    try {
      const envPath = join(__dirname, '..', envFile);
      const envContent = readFileSync(envPath, 'utf-8');
      
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([^#=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            env[key] = value;
          }
        }
      });
      
      if (Object.keys(env).length > 0) {
        break;
      }
    } catch (error) {
      // Continua tentando outros arquivos
    }
  }
  
  return env;
}

async function testBlogSlugs() {
  const env = loadEnv();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                      process.env.REACT_APP_SUPABASE_URL || 
                      env.VITE_SUPABASE_URL ||
                      env.REACT_APP_SUPABASE_URL;
  
  const supabaseKey = process.env.VITE_SUPABASE_KEY || 
                      process.env.REACT_APP_SUPABASE_KEY || 
                      env.VITE_SUPABASE_KEY ||
                      env.REACT_APP_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔍 Verificando posts no banco de dados...\n');
    
    // Busca todos os posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar posts:', error);
      process.exit(1);
    }

    if (!posts || posts.length === 0) {
      console.log('⚠️ Nenhum post encontrado no banco de dados.');
      process.exit(0);
    }

    console.log(`📝 Total de posts: ${posts.length}\n`);
    
    // Verifica quais têm slug
    const withSlug = posts.filter(p => p.slug && p.slug.trim() !== '');
    const withoutSlug = posts.filter(p => !p.slug || p.slug.trim() === '');

    console.log(`✅ Posts com slug: ${withSlug.length}`);
    console.log(`⚠️ Posts sem slug: ${withoutSlug.length}\n`);

    if (withSlug.length > 0) {
      console.log('📋 Exemplos de posts com slug:');
      withSlug.slice(0, 5).forEach(post => {
        console.log(`   - ID ${post.id}: "${post.title.substring(0, 40)}..."`);
        console.log(`     Slug: ${post.slug}`);
        console.log(`     URL: /blog/${post.slug}\n`);
      });
    }

    if (withoutSlug.length > 0) {
      console.log('⚠️ Posts sem slug (precisam de migração):');
      withoutSlug.forEach(post => {
        console.log(`   - ID ${post.id}: "${post.title.substring(0, 40)}..."`);
      });
      console.log('\n💡 Execute: npm run migrate:blog-slugs\n');
    }

    // Verifica se há slugs duplicados
    const slugs = withSlug.map(p => p.slug);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicates.length > 0) {
      console.log('⚠️ Slugs duplicados encontrados:');
      duplicates.forEach(slug => {
        const postsWithSlug = withSlug.filter(p => p.slug === slug);
        console.log(`   - Slug "${slug}" usado por ${postsWithSlug.length} posts:`);
        postsWithSlug.forEach(p => console.log(`     * ID ${p.id}: "${p.title}"`));
      });
    } else {
      console.log('✅ Todos os slugs são únicos!\n');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

testBlogSlugs();

