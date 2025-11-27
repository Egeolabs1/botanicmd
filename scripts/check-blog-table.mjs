/**
 * Script para verificar a estrutura da tabela blog_posts
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      
      if (Object.keys(env).length > 0) break;
    } catch (error) {}
  }
  
  return env;
}

async function checkTable() {
  const env = loadEnv();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔍 Verificando estrutura da tabela blog_posts...\n');
    
    // Tenta buscar um post com todos os campos
    const { data: samplePost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.error('❌ Tabela blog_posts não existe!');
        console.log('💡 Execute o SQL em scripts/add-slug-to-blog-posts.sql primeiro\n');
      } else {
        console.error('❌ Erro:', fetchError.message);
      }
      process.exit(1);
    }

    console.log('✅ Tabela existe!');
    console.log('\n📋 Campos disponíveis:');
    if (samplePost) {
      Object.keys(samplePost).forEach(key => {
        const value = samplePost[key];
        const type = value === null ? 'null' : typeof value;
        const hasSlug = key === 'slug';
        console.log(`   ${hasSlug ? '✅' : '  '} ${key}: ${type} ${value !== null ? `(${String(value).substring(0, 30)}...)` : ''}`);
      });
    }

    // Verifica se a coluna slug existe
    const hasSlugColumn = samplePost && 'slug' in samplePost;
    
    if (!hasSlugColumn) {
      console.log('\n❌ Coluna "slug" NÃO existe na tabela!');
      console.log('💡 Execute este SQL no Supabase Dashboard:');
      console.log('   ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug TEXT;\n');
    } else {
      console.log('\n✅ Coluna "slug" existe!');
      
      // Tenta fazer um update de teste
      const testSlug = 'test-slug-' + Date.now();
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ slug: testSlug })
        .eq('id', samplePost.id)
        .select();

      if (updateError) {
        console.log('\n❌ Erro ao fazer update de teste:', updateError.message);
        console.log('💡 Verifique as permissões RLS da tabela\n');
      } else {
        console.log('✅ Update funcionou! Revertendo teste...');
        await supabase
          .from('blog_posts')
          .update({ slug: null })
          .eq('id', samplePost.id);
        console.log('✅ Teste revertido\n');
      }
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

checkTable();

