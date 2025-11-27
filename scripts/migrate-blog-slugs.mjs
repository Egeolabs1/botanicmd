/**
 * Script para migrar slugs dos posts do blog
 * 
 * Execute: node scripts/migrate-blog-slugs.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Função para gerar slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateUniqueSlug(title, id) {
  const baseSlug = generateSlug(title);
  return `${baseSlug}-${id}`;
}

// Carrega variáveis de ambiente
function loadEnv() {
  const env = {};
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    try {
      const envPath = join(__dirname, '..', envFile);
      const envContent = readFileSync(envPath, 'utf-8');
      
      envContent.split('\n').forEach(line => {
        // Ignora comentários e linhas vazias
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([^#=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove aspas se houver
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            env[key] = value;
          }
        }
      });
      
      if (Object.keys(env).length > 0) {
        console.log(`✅ Variáveis carregadas de ${envFile}`);
        break;
      }
    } catch (error) {
      // Continua tentando outros arquivos
    }
  }
  
  return env;
}

async function migrateBlogSlugs() {
  console.log('🔍 Procurando variáveis de ambiente...\n');
  
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
    console.error('❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_KEY devem estar configurados.\n');
    console.log('📝 Opções para configurar:\n');
    console.log('1. Criar arquivo .env.local na raiz do projeto com:');
    console.log('   VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('   VITE_SUPABASE_KEY=sua_chave_anon_public\n');
    console.log('2. Ou definir variáveis de ambiente do sistema:');
    console.log('   $env:VITE_SUPABASE_URL="https://seu-projeto.supabase.co"');
    console.log('   $env:VITE_SUPABASE_KEY="sua_chave"\n');
    console.log('3. Ou passar como argumentos:');
    console.log('   VITE_SUPABASE_URL=... VITE_SUPABASE_KEY=... npm run migrate:blog-slugs\n');
    console.log('💡 Dica: Veja env.local.example para exemplo de formato.\n');
    process.exit(1);
  }
  
  console.log('✅ Variáveis encontradas!');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Busca todos os posts (vamos verificar quais precisam de slug)
    const { data: allPosts, error: fetchAllError } = await supabase
      .from('blog_posts')
      .select('id, title, slug')
      .order('id', { ascending: true });

    if (fetchAllError) {
      console.error('❌ Erro ao buscar posts:', fetchAllError);
      console.log('\n💡 Verifique se:');
      console.log('   - A tabela blog_posts existe no Supabase');
      console.log('   - As credenciais estão corretas');
      console.log('   - Você tem permissão para acessar a tabela\n');
      process.exit(1);
    }

    if (!allPosts || allPosts.length === 0) {
      console.log('✅ Nenhum post encontrado no banco de dados.');
      process.exit(0);
    }

    // Filtra posts que precisam de slug
    const posts = allPosts.filter(post => !post.slug || post.slug.trim() === '');

    if (!posts || posts.length === 0) {
      console.log('✅ Nenhum post precisa de migração. Todos já têm slugs.');
      process.exit(0);
    }

    console.log(`📝 Encontrados ${posts.length} posts para migrar...\n`);

    let updated = 0;
    let errors = 0;

    // Atualiza cada post com seu slug
    for (const post of posts) {
      try {
        const slug = generateUniqueSlug(post.title, post.id);
        
        // Faz o update (sem .single() para evitar erro se RLS bloquear)
        const { data: updateData, error: updateError } = await supabase
          .from('blog_posts')
          .update({ slug })
          .eq('id', post.id)
          .select('id, slug');

        if (updateError) {
          console.error(`❌ Erro ao atualizar post ${post.id}:`, updateError.message);
          if (updateError.code === 'PGRST116' || updateError.message.includes('0 rows')) {
            console.error(`   ⚠️ RLS pode estar bloqueando o update. Verifique as políticas RLS da tabela blog_posts.`);
            console.error(`   💡 Solução: Adicione política UPDATE ou use service_role key.`);
          }
          errors++;
        } else if (!updateData || updateData.length === 0) {
          console.error(`❌ Post ${post.id}: Update retornou 0 linhas (RLS bloqueando?)`);
          errors++;
        } else {
          // Verifica se realmente foi salvo
          const { data: verifyData, error: verifyError } = await supabase
            .from('blog_posts')
            .select('id, slug')
            .eq('id', post.id);

          if (verifyError) {
            console.error(`⚠️ Post ${post.id} atualizado mas não foi possível verificar:`, verifyError.message);
            updated++;
          } else if (verifyData && verifyData.length > 0 && verifyData[0].slug === slug) {
            console.log(`✅ Post ${post.id}: "${post.title.substring(0, 50)}..." → ${slug}`);
            updated++;
          } else {
            const actualSlug = verifyData && verifyData.length > 0 ? verifyData[0].slug : 'null';
            console.error(`❌ Post ${post.id} atualizado mas slug não foi salvo! (esperado: ${slug}, obtido: ${actualSlug})`);
            errors++;
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar post ${post.id}:`, error.message);
        console.error(`   Stack:`, error.stack);
        errors++;
      }
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`   - Posts atualizados: ${updated}`);
    console.log(`   - Erros: ${errors}`);

    if (errors === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

migrateBlogSlugs();

