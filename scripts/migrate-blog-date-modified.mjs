#!/usr/bin/env node

/**
 * Script para migrar e popular o campo date_modified nos posts do blog
 * 
 * Este script:
 * 1. Verifica se a coluna date_modified existe
 * 2. Atualiza posts que não têm date_modified definido
 * 3. Usa created_at como base se date_modified for NULL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Função para carregar variáveis de ambiente
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  const envPathAlt = join(__dirname, '..', '.env');
  
  let envContent = '';
  
  try {
    envContent = readFileSync(envPath, 'utf-8');
  } catch (e) {
    try {
      envContent = readFileSync(envPathAlt, 'utf-8');
    } catch (e2) {
      console.warn('⚠️  Arquivo .env não encontrado. Usando variáveis de ambiente do sistema.');
    }
  }
  
  if (envContent) {
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove aspas se existirem
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

// Carrega variáveis de ambiente
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_KEY devem estar configurados.');
  console.error('   Configure no arquivo .env.local ou .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnExists() {
  try {
    // Tenta fazer uma query que inclui date_modified
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, date_modified')
      .limit(1);
    
    if (error) {
      // Se o erro for sobre coluna não existir, retorna false
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return false;
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar coluna:', error.message);
    return false;
  }
}

async function migrateDateModified() {
  console.log('🚀 Iniciando migração de date_modified...\n');

  // Verifica se a coluna existe
  const columnExists = await checkColumnExists();
  
  if (!columnExists) {
    console.error('❌ Erro: A coluna date_modified não existe na tabela blog_posts.');
    console.error('   Execute primeiro o script SQL: scripts/add-date-modified-to-blog-posts.sql');
    process.exit(1);
  }

  try {
    // Busca todos os posts
    console.log('📥 Buscando posts do banco de dados...');
    const { data: allPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, created_at, date_modified, date')
      .order('id', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!allPosts || allPosts.length === 0) {
      console.log('ℹ️  Nenhum post encontrado no banco de dados.');
      return;
    }

    console.log(`✅ Encontrados ${allPosts.length} posts\n`);

    // Filtra posts que precisam de atualização (date_modified é NULL)
    const postsToUpdate = allPosts.filter(post => !post.date_modified);

    if (postsToUpdate.length === 0) {
      console.log('✅ Todos os posts já têm date_modified definido!');
      return;
    }

    console.log(`📝 Atualizando ${postsToUpdate.length} posts...\n`);

    let successCount = 0;
    let errorCount = 0;

    // Atualiza cada post
    for (const post of postsToUpdate) {
      try {
        // Usa created_at como base, ou data atual se não houver created_at
        const dateToUse = post.created_at || new Date().toISOString();

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ date_modified: dateToUse })
          .eq('id', post.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar post ${post.id}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Post ${post.id} atualizado com sucesso`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar post ${post.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Resumo da Migração:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📝 Total processado: ${postsToUpdate.length}`);
    console.log('='.repeat(50) + '\n');

    if (errorCount === 0) {
      console.log('🎉 Migração concluída com sucesso!');
    } else {
      console.log('⚠️  Migração concluída com alguns erros. Verifique os logs acima.');
    }
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

// Executa a migração
migrateDateModified()
  .then(() => {
    console.log('\n✅ Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

