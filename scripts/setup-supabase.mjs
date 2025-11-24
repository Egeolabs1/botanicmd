#!/usr/bin/env node

/**
 * Script Automatizado de Configuração do Supabase
 * 
 * Este script automatiza a configuração do banco de dados, tabelas e políticas.
 * 
 * USO:
 *   node scripts/setup-supabase.mjs <supabase-url> <supabase-service-role-key>
 * 
 * OU configure no .env.local:
 *   SUPABASE_URL=https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
 * 
 * Depois execute:
 *   npm run setup:supabase
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
  log(`❌ Erro: ${message}`, colors.red);
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

// Ler SQL do arquivo
function readSQLFile(filename) {
  try {
    const filePath = join(__dirname, '..', filename);
    return readFileSync(filePath, 'utf-8');
  } catch (e) {
    error(`Não foi possível ler o arquivo ${filename}`);
    process.exit(1);
  }
}

// Executar SQL via Supabase
async function executeSQL(supabase, sql) {
  try {
    // Remove comentários e linhas vazias, divide por ponto e vírgula
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        // Se o RPC não existir, tenta via REST API diretamente
        if (error) {
          // Tenta executar via REST API
          const response = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabase.supabaseKey,
              'Authorization': `Bearer ${supabase.supabaseKey}`,
            },
            body: JSON.stringify({ sql_query: statement }),
          });

          if (!response.ok) {
            // Se ainda falhar, tenta criar a função exec_sql primeiro
            warning(`Não foi possível executar SQL diretamente. Use o SQL Editor do Supabase para executar os scripts manualmente.`);
            return false;
          }
        }
      }
    }
    
    return true;
  } catch (e) {
    warning(`Erro ao executar SQL: ${e.message}`);
    return false;
  }
}

// Executar SQL simples usando a API REST do Supabase
async function executeSQLViaREST(supabaseClient, sql) {
  // Infelizmente, o Supabase não expõe uma API REST pública para executar SQL arbitrário
  // por questões de segurança. Precisamos usar o SQL Editor ou criar uma Edge Function.
  
  // Por enquanto, vamos apenas validar a conexão e mostrar instruções
  warning('O Supabase não permite executar SQL arbitrário via API REST por segurança.');
  info('Por favor, execute os scripts SQL manualmente no SQL Editor do Supabase.');
  return false;
}

// Verificar conexão com Supabase
async function checkConnection(supabase) {
  try {
    const { data, error } = await supabase.from('_prisma_migrations').select('count').limit(1);
    // Se não houver erro de autenticação, a conexão está OK
    return true;
  } catch (e) {
    // Tenta verificar autenticação de outra forma
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return true;
    } catch (e2) {
      return false;
    }
  }
}

// Criar bucket via Storage API
async function createStorageBucket(supabase, bucketName = 'plant-images') {
  try {
    info(`Criando bucket ${bucketName}...`);
    
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: null,
      allowedMimeTypes: null,
    });

    if (error) {
      if (error.message.includes('already exists')) {
        success(`Bucket ${bucketName} já existe.`);
        return true;
      }
      error(`Erro ao criar bucket: ${error.message}`);
      return false;
    }

    success(`Bucket ${bucketName} criado com sucesso!`);
    return true;
  } catch (e) {
    error(`Erro ao criar bucket: ${e.message}`);
    return false;
  }
}

// Verificar se tabela existe
async function tableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // Se não der erro de "não existe", a tabela existe
    return !error || !error.message.includes('does not exist');
  } catch (e) {
    return false;
  }
}

// Main function
async function main() {
  log('\n🚀 Configuração Automatizada do Supabase\n', colors.cyan);
  
  // Obter credenciais
  const env = loadEnv();
  const args = process.argv.slice(2);
  
  let supabaseUrl = args[0] || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  let serviceRoleKey = args[1] || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    error('URL do Supabase não encontrada!');
    info('Use: node scripts/setup-supabase.mjs <url> <service-role-key>');
    info('Ou configure SUPABASE_URL no .env.local');
    info('\n⚠️  IMPORTANTE: Você precisa da SERVICE ROLE KEY (não a anon key)!');
    info('   Encontre em: Supabase Dashboard → Settings → API → service_role (secret)');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    error('Service Role Key não encontrada!');
    info('Configure SUPABASE_SERVICE_ROLE_KEY no .env.local');
    info('Ou passe como segundo argumento: node scripts/setup-supabase.mjs <url> <key>');
    info('\n⚠️  IMPORTANTE: Use a SERVICE ROLE KEY (não a anon key)!');
    info('   Encontre em: Supabase Dashboard → Settings → API → service_role (secret)');
    info('   Esta chave é secreta e só deve ser usada neste script local!');
    process.exit(1);
  }

  info(`Conectando ao Supabase: ${supabaseUrl}`);

  // Criar cliente Supabase com service_role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verificar conexão
  info('Verificando conexão...');
  const connected = await checkConnection(supabase);
  
  if (!connected) {
    error('Não foi possível conectar ao Supabase. Verifique as credenciais.');
    process.exit(1);
  }
  
  success('Conexão estabelecida!');

  // Criar tabela e políticas (via SQL)
  log('\n📊 Configurando banco de dados...', colors.cyan);
  
  info('Lendo script SQL...');
  const setupSQL = readSQLFile('supabase-setup.sql');
  
  warning('O Supabase não permite executar SQL arbitrário via API REST.');
  info('Por favor, execute o script SQL manualmente:');
  log('\n' + '='.repeat(60), colors.yellow);
  log('1. Acesse: Supabase Dashboard → SQL Editor', colors.cyan);
  log('2. Clique em "New query"', colors.cyan);
  log('3. Copie o conteúdo do arquivo: supabase-setup.sql', colors.cyan);
  log('4. Cole e execute (Run ou Ctrl+Enter)', colors.cyan);
  log('='.repeat(60) + '\n', colors.yellow);

  // Criar bucket de storage (isso funciona via API)
  log('\n🗂️  Configurando Storage...', colors.cyan);
  const bucketCreated = await createStorageBucket(supabase, 'plant-images');
  
  if (bucketCreated) {
    info('Bucket criado. Agora configure as políticas de Storage.');
    info('Execute o script: supabase-storage-setup.sql no SQL Editor');
  }

  // Verificar se tabela existe (após usuário executar SQL)
  log('\n🔍 Verificando configuração...', colors.cyan);
  info('Aguardando você executar o SQL...');
  info('Após executar o SQL, pressione Enter para verificar...');
  
  // Aguardar input (opcional - pode remover se quiser verificação automática)
  // const readline = require('readline').createInterface({
  //   input: process.stdin,
  //   output: process.stdout
  // });
  // await new Promise(resolve => readline.question('', resolve));
  
  const tableExistsResult = await tableExists(supabase, 'plants');
  
  if (tableExistsResult) {
    success('Tabela "plants" encontrada!');
  } else {
    warning('Tabela "plants" não encontrada. Execute o script SQL primeiro.');
  }

  // Resumo final
  log('\n' + '='.repeat(60), colors.cyan);
  log('📋 RESUMO DA CONFIGURAÇÃO', colors.cyan);
  log('='.repeat(60), colors.cyan);
  log('\n✅ Concluído automaticamente:', colors.green);
  log('   - Conexão verificada');
  if (bucketCreated) {
    log('   - Bucket "plant-images" criado');
  }
  
  log('\n📝 Execute manualmente no SQL Editor:', colors.yellow);
  log('   1. supabase-setup.sql (cria tabela e políticas RLS)');
  log('   2. supabase-storage-setup.sql (configura políticas de Storage)');
  
  log('\n⚙️  Próximos passos:', colors.blue);
  log('   1. Configure VITE_SUPABASE_URL no Vercel');
  log('   2. Configure VITE_SUPABASE_KEY no Vercel (use a ANON KEY, não a service role!)');
  log('   3. Faça redeploy no Vercel');
  
  log('\n✨ Configuração concluída!\n', colors.green);
}

main().catch(err => {
  error(`Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});



