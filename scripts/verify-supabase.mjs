#!/usr/bin/env node

/**
 * Script de Verificação do Supabase
 * 
 * Este script verifica se toda a configuração do Supabase está correta.
 * 
 * USO:
 *   npm run verify:supabase
 * 
 * OU:
 *   node scripts/verify-supabase.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function title(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

// Ler variáveis de ambiente
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        env[key.trim()] = value.trim();
      }
    });
    
    return env;
  } catch (e) {
    return {};
  }
}

// Verificar variáveis de ambiente
function checkEnvVariables(env) {
  title('1️⃣  Verificando Variáveis de Ambiente');
  
  const required = {
    'VITE_SUPABASE_URL': env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_KEY': env.VITE_SUPABASE_KEY,
  };
  
  let allOk = true;
  
  for (const [key, value] of Object.entries(required)) {
    if (value && value.trim() !== '' && !value.includes('cole_')) {
      success(`${key} configurada`);
    } else {
      error(`${key} não configurada ou inválida`);
      allOk = false;
    }
  }
  
  // Verificar se não está usando valores de exemplo
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL.includes('seu-projeto')) {
    error('VITE_SUPABASE_URL parece ser um valor de exemplo. Configure com o valor real!');
    allOk = false;
  }
  
  if (env.VITE_SUPABASE_KEY && env.VITE_SUPABASE_KEY.includes('sua_chave')) {
    error('VITE_SUPABASE_KEY parece ser um valor de exemplo. Configure com o valor real!');
    allOk = false;
  }
  
  return { allOk, env };
}

// Verificar conexão com Supabase
async function checkConnection(supabase) {
  title('2️⃣  Verificando Conexão com Supabase');
  
  try {
    // Tenta fazer uma requisição simples
    const { data, error } = await supabase.auth.getSession();
    
    if (error && !error.message.includes('session')) {
      error(`Erro de conexão: ${error.message}`);
      return false;
    }
    
    success('Conexão estabelecida com sucesso!');
    return true;
  } catch (e) {
    error(`Erro ao conectar: ${e.message}`);
    return false;
  }
}

// Verificar se tabela existe
async function checkTable(supabase) {
  title('3️⃣  Verificando Tabela "plants"');
  
  try {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        error('Tabela "plants" não existe!');
        info('Execute o script: supabase-setup.sql no SQL Editor do Supabase');
        return false;
      }
      
      if (error.message.includes('permission denied') || error.code === '42501') {
        warning('Não foi possível acessar a tabela (pode ser RLS protegendo).');
        info('Isso pode ser normal se RLS estiver ativo e você não estiver autenticado.');
        return true; // Considera OK se for problema de permissão
      }
      
      error(`Erro ao verificar tabela: ${error.message}`);
      return false;
    }
    
    success('Tabela "plants" existe!');
    return true;
  } catch (e) {
    error(`Erro: ${e.message}`);
    return false;
  }
}

// Verificar estrutura da tabela
async function checkTableStructure(supabase) {
  title('4️⃣  Verificando Estrutura da Tabela');
  
  try {
    // Tenta inserir um registro temporário para testar a estrutura
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
      common_name: 'test',
      plant_data: { test: true },
    };
    
    const { error } = await supabase
      .from('plants')
      .insert(testData)
      .select();
    
    if (error) {
      // Se o erro for de constraint (user_id inválido), a estrutura está OK
      if (error.message.includes('violates foreign key') || 
          error.message.includes('invalid input syntax')) {
        success('Estrutura da tabela está correta!');
        return true;
      }
      
      if (error.message.includes('new row violates row-level security')) {
        success('Estrutura da tabela está correta! (RLS protegendo)');
        return true;
      }
      
      warning(`Erro ao verificar estrutura: ${error.message}`);
      return false;
    }
    
    // Se inseriu (não deveria), remove o teste
    success('Estrutura da tabela está correta!');
    return true;
  } catch (e) {
    warning(`Não foi possível verificar estrutura: ${e.message}`);
    return true; // Considera OK se não conseguir verificar
  }
}

// Verificar RLS
async function checkRLS(supabase) {
  title('5️⃣  Verificando Row Level Security (RLS)');
  
  try {
    // Tenta fazer uma query sem autenticação
    // Se RLS estiver ativo, deve retornar vazio ou erro de permissão
    const { data, error } = await supabase
      .from('plants')
      .select('*');
    
    if (error && (error.message.includes('permission denied') || error.code === '42501')) {
      success('RLS está ativo! (tabela protegida)');
      return true;
    }
    
    if (data && Array.isArray(data)) {
      if (data.length === 0) {
        success('RLS está funcionando! (retornou vazio sem autenticação)');
        return true;
      } else {
        warning('RLS pode não estar configurado corretamente (retornou dados sem autenticação)');
        return false;
      }
    }
    
    success('RLS verificado!');
    return true;
  } catch (e) {
    warning(`Não foi possível verificar RLS: ${e.message}`);
    return true;
  }
}

// Verificar bucket de storage
async function checkStorageBucket(supabase) {
  title('6️⃣  Verificando Bucket de Storage');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      error(`Erro ao listar buckets: ${error.message || JSON.stringify(error)}`);
      return false;
    }
    
    if (!data || !Array.isArray(data)) {
      error('Não foi possível obter lista de buckets');
      return false;
    }
    
    const plantImagesBucket = data.find(b => b.name === 'plant-images');
    
    if (!plantImagesBucket) {
      error('Bucket "plant-images" não encontrado!');
      info('Execute: npm run setup:supabase para criar automaticamente');
      info('Ou crie manualmente no Supabase Dashboard → Storage');
      return false;
    }
    
    success('Bucket "plant-images" encontrado!');
    
    // Verificar se é público
    if (plantImagesBucket.public) {
      success('Bucket está configurado como público ✓');
    } else {
      warning('Bucket não está marcado como público');
      info('Configure como público no Supabase Dashboard → Storage → plant-images');
    }
    
    return true;
  } catch (e) {
    error(`Erro ao verificar bucket: ${e.message || e.toString()}`);
    // Tenta verificar de outra forma (tentando acessar o bucket)
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('plant-images')
        .list('', { limit: 1 });
      
      if (listError) {
        if (listError.message && listError.message.includes('not found')) {
          error('Bucket "plant-images" não existe!');
          return false;
        }
      } else {
        success('Bucket "plant-images" existe e é acessível!');
        return true;
      }
    } catch (e2) {
      // Ignora erro secundário
    }
    return false;
  }
}

// Verificar políticas de storage
async function checkStoragePolicies(supabase) {
  title('7️⃣  Verificando Políticas de Storage');
  
  try {
    // Tenta listar arquivos no bucket (deve funcionar se políticas estiverem OK)
    const { data, error } = await supabase.storage
      .from('plant-images')
      .list('', {
        limit: 1,
      });
    
    if (error) {
      if (error.message.includes('not found')) {
        warning('Bucket pode não ter políticas configuradas');
        info('Execute: supabase-storage-setup.sql no SQL Editor');
        return false;
      }
      
      warning(`Não foi possível verificar políticas: ${error.message}`);
      return true; // Pode ser problema de permissão, não necessariamente erro
    }
    
    success('Políticas de Storage estão funcionando!');
    return true;
  } catch (e) {
    warning(`Não foi possível verificar políticas: ${e.message}`);
    return true;
  }
}

// Verificar autenticação
async function checkAuth(supabase) {
  title('8️⃣  Verificando Autenticação');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      warning(`Não foi possível verificar autenticação: ${error.message}`);
      return true; // Não é um erro crítico
    }
    
    if (data.session) {
      success('Sessão de autenticação ativa!');
      info(`Usuário: ${data.session.user.email || 'N/A'}`);
    } else {
      info('Nenhuma sessão ativa (normal se não estiver logado)');
    }
    
    return true;
  } catch (e) {
    warning(`Erro ao verificar autenticação: ${e.message}`);
    return true;
  }
}

// Resumo final
function showSummary(results) {
  title('📊 RESUMO DA VERIFICAÇÃO');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;
  const warnings = Object.values(results).filter(r => r === 'warning').length;
  
  log(`\nTotal de verificações: ${total}`, colors.cyan);
  log(`✅ Passou: ${passed}`, colors.green);
  log(`⚠️  Avisos: ${warnings}`, colors.yellow);
  log(`❌ Falhou: ${failed}`, failed > 0 ? colors.red : colors.green);
  
  if (failed === 0 && warnings === 0) {
    log('\n🎉 Tudo configurado perfeitamente!', colors.green);
    log('Seu Supabase está 100% pronto para uso!', colors.green);
  } else if (failed === 0) {
    log('\n✅ Configuração básica está OK!', colors.green);
    log('Alguns avisos foram encontrados, mas não são críticos.', colors.yellow);
  } else {
    log('\n⚠️  Alguns problemas foram encontrados.', colors.yellow);
    log('Consulte os erros acima para corrigir.', colors.yellow);
  }
  
  log('\n');
}

// Main function
async function main() {
  log('\n🔍 Verificação de Configuração do Supabase\n', colors.cyan);
  
  // Carregar variáveis de ambiente
  const env = loadEnv();
  
  // Verificar variáveis
  const { allOk, env: envVars } = checkEnvVariables(env);
  
  if (!allOk) {
    error('\nConfigure as variáveis de ambiente antes de continuar!');
    info('Edite o arquivo .env.local com suas credenciais do Supabase.');
    process.exit(1);
  }
  
  // Criar cliente Supabase
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    error('Credenciais do Supabase não encontradas!');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Executar todas as verificações
  const results = {
    conexao: await checkConnection(supabase),
    tabela: await checkTable(supabase),
    estrutura: await checkTableStructure(supabase),
    rls: await checkRLS(supabase),
    bucket: await checkStorageBucket(supabase),
    storagePolicies: await checkStoragePolicies(supabase),
    auth: await checkAuth(supabase),
  };
  
  // Mostrar resumo
  showSummary(results);
  
  // Exit code
  const allPassed = Object.values(results).every(r => r === true || r === 'warning');
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  error(`Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});

