/**
 * Script de migração para adicionar slugs aos posts existentes
 * 
 * Este script atualiza todos os posts existentes no Supabase
 * adicionando slugs únicos baseados no título e ID.
 * 
 * Execute este script uma vez após implementar a funcionalidade de slugs.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { generateUniqueSlug } from '../utils/slug';

export async function migrateBlogSlugs(): Promise<{ updated: number; errors: number }> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado. Migração não necessária (usando localStorage).');
    return { updated: 0, errors: 0 };
  }

  try {
    // Busca todos os posts sem slug ou com slug vazio
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug')
      .or('slug.is.null,slug.eq.');

    if (fetchError) {
      console.error('Erro ao buscar posts:', fetchError);
      return { updated: 0, errors: 1 };
    }

    if (!posts || posts.length === 0) {
      console.log('✅ Nenhum post precisa de migração. Todos já têm slugs.');
      return { updated: 0, errors: 0 };
    }

    console.log(`📝 Encontrados ${posts.length} posts para migrar...`);

    let updated = 0;
    let errors = 0;

    // Atualiza cada post com seu slug
    for (const post of posts) {
      try {
        const slug = generateUniqueSlug(post.title, post.id);
        
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ slug })
          .eq('id', post.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar post ${post.id}:`, updateError);
          errors++;
        } else {
          console.log(`✅ Post ${post.id} atualizado com slug: ${slug}`);
          updated++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar post ${post.id}:`, error);
        errors++;
      }
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`   - Posts atualizados: ${updated}`);
    console.log(`   - Erros: ${errors}`);

    return { updated, errors };
  } catch (error: any) {
    console.error('Erro fatal na migração:', error);
    return { updated: 0, errors: 1 };
  }
}

// Se executado diretamente (ex: node scripts/migrate-slugs.mjs)
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateBlogSlugs()
    .then(({ updated, errors }) => {
      if (errors === 0) {
        console.log('\n🎉 Migração concluída com sucesso!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Migração concluída com erros.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

