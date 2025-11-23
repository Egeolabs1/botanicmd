# Relatório de Análise de Segurança - BotanicMD

## 🔴 FALHAS CRÍTICAS DE SEGURANÇA

### 1. **Acesso ao Painel Admin SEM Autenticação**
**Localização:** `pages/AppMain.tsx:391`, `components/UserProfile.tsx:144`

**Problema:** O painel administrativo está acessível a qualquer usuário sem verificação de permissões. Qualquer pessoa pode acessar o AdminDashboard clicando no botão "Admin Panel".

**Impacto:** 
- Acesso não autorizado a dados de todos os usuários
- Modificação de planos de usuários
- Exclusão de usuários
- Gerenciamento de conteúdo do blog

**Solução:**
```typescript
// Adicionar verificação de admin no UserProfile.tsx
const isAdmin = user?.email === 'admin@botanicmd.com' || user?.id === 'user_admin';

// E no AppMain.tsx antes de mostrar AdminDashboard
if (appState === AppState.ADMIN) {
  if (!isAdmin) {
    alert('Acesso negado. Apenas administradores podem acessar este painel.');
    setAppState(AppState.IDLE);
    return;
  }
  // ... resto do código
}
```

### 2. **XSS (Cross-Site Scripting) via dangerouslySetInnerHTML**
**Localização:** `components/BlogPage.tsx:60`

**Problema:** O conteúdo do blog é renderizado diretamente usando `dangerouslySetInnerHTML` sem sanitização. Se um administrador malicioso ou um atacante conseguir injetar HTML/JavaScript no conteúdo do blog, isso pode executar código malicioso no navegador dos usuários.

**Impacto:**
- Roubo de cookies/sessões
- Redirecionamento para sites maliciosos
- Roubo de dados do localStorage
- Ataques de phishing

**Solução:**
```typescript
// Instalar: npm install dompurify @types/dompurify
import DOMPurify from 'dompurify';

// No BlogPage.tsx
<div 
  className="prose prose-lg prose-green max-w-none text-gray-700 leading-relaxed"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.content) }}
/>
```

### 3. **Dados Sensíveis no localStorage sem Criptografia**
**Localização:** `contexts/AuthContext.tsx`, `services/adminService.ts`, `services/blogService.ts`

**Problema:** Dados de usuários, planos, e informações sensíveis são armazenados em localStorage sem criptografia. Qualquer script no domínio pode acessar esses dados.

**Impacto:**
- Exposição de dados de usuários
- Manipulação de planos (usuário pode editar localStorage para se tornar PRO)
- Acesso a emails e informações pessoais

**Solução:**
- Usar variáveis de ambiente para dados sensíveis
- Implementar criptografia para dados críticos no localStorage
- Mover dados sensíveis para o backend (Supabase)

### 4. **Validação de Entrada Insuficiente na API**
**Localização:** `api/gemini.ts`

**Problema:** A API não valida adequadamente:
- Tamanho da imagem base64 (pode causar DoS)
- Tipo MIME da imagem
- Tamanho do prompt (pode causar custos elevados)
- Rate limiting ausente

**Impacto:**
- Ataques de DoS (Denial of Service)
- Custos elevados na API Gemini
- Sobrecarga do servidor

**Solução:**
```typescript
// Adicionar validações
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROMPT_LENGTH = 5000;

if (base64Image.length > MAX_IMAGE_SIZE) {
  return res.status(400).json({ error: 'Imagem muito grande' });
}

if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
  return res.status(400).json({ error: 'Prompt muito longo' });
}
```

### 5. **Chaves de API Expostas no Cliente**
**Localização:** `vite.config.ts:16-19`

**Problema:** O Vite está configurado para expor variáveis de ambiente no cliente, incluindo possíveis chaves de API.

**Impacto:**
- Exposição de credenciais no bundle JavaScript
- Qualquer pessoa pode ver as chaves no código fonte

**Solução:**
- Remover `GEMINI_API_KEY` e `VITE_GEMINI_API_KEY` do `vite.config.ts`
- Manter apenas no servidor (Vercel Edge Function)
- Usar apenas variáveis com prefixo `VITE_` para dados públicos

## 🟡 FALHAS MODERADAS DE SEGURANÇA

### 6. **Falta de Rate Limiting**
**Localização:** `api/gemini.ts`

**Problema:** Não há limite de requisições por usuário/IP, permitindo abuso da API.

**Solução:**
- Implementar rate limiting por IP/usuário
- Usar Vercel Edge Config ou Redis para tracking

### 7. **Validação de Upload de Arquivo Insuficiente**
**Localização:** `components/UploadSection.tsx:40-50`

**Problema:** 
- Valida apenas `file.type.startsWith('image/')` que pode ser falsificado
- Não valida magic bytes (assinatura do arquivo)
- Não valida dimensões da imagem

**Solução:**
```typescript
// Validar magic bytes
const isValidImage = async (file: File): Promise<boolean> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // WebP: RIFF...WEBP
  // ... outras validações
  
  return false;
};
```

### 8. **CORS Não Configurado**
**Localização:** `api/gemini.ts`

**Problema:** Não há configuração explícita de CORS, o que pode permitir requisições de origens não autorizadas.

**Solução:**
```typescript
// Adicionar headers CORS
res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://seu-dominio.com');
res.setHeader('Access-Control-Allow-Methods', 'POST');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### 9. **Logs com Informações Sensíveis**
**Localização:** `contexts/AuthContext.tsx:199-205`, `api/gemini.ts:261`

**Problema:** Logs no console podem expor informações sensíveis em produção.

**Solução:**
- Remover `console.log` de produção
- Usar biblioteca de logging com níveis (winston, pino)
- Não logar dados de usuários ou tokens

### 10. **Falta de Validação de Sessão no Backend**
**Localização:** `api/gemini.ts`

**Problema:** A API não verifica se o usuário está autenticado antes de processar requisições.

**Solução:**
```typescript
// Verificar token de autenticação
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Não autenticado' });
}
```

## 🟢 PROBLEMAS DE IMPLEMENTAÇÃO

### 11. **Modo Demo Permite Bypass de Autenticação**
**Localização:** `contexts/AuthContext.tsx:102-121`

**Problema:** O modo demo permite login sem verificação real, o que pode ser explorado.

**Solução:**
- Desabilitar modo demo em produção
- Adicionar flag de ambiente `NODE_ENV=production`

### 12. **Falta de Tratamento de Erros Consistente**
**Localização:** Múltiplos arquivos

**Problema:** Erros são tratados de forma inconsistente, alguns com `alert()`, outros silenciosamente.

**Solução:**
- Criar sistema centralizado de tratamento de erros
- Usar toast notifications ao invés de `alert()`

### 13. **SQL Injection Potencial (Supabase)**
**Localização:** `services/storageService.ts:45-49`

**Problema:** Embora Supabase use prepared statements, é importante validar inputs.

**Solução:**
- Validar todos os inputs antes de queries
- Usar tipos TypeScript para garantir tipos corretos

### 14. **Falta de Validação de Schema**
**Localização:** `services/geminiService.ts`

**Problema:** Respostas da API Gemini não são validadas contra o schema esperado.

**Solução:**
```typescript
import { z } from 'zod';

const PlantDataSchema = z.object({
  commonName: z.string(),
  scientificName: z.string(),
  // ... outros campos
});

const validatedData = PlantDataSchema.parse(plantData);
```

### 15. **Armazenamento de Imagens Base64 no localStorage**
**Localização:** `services/storageService.ts:27`

**Problema:** Imagens base64 são muito grandes para localStorage (limite ~5-10MB).

**Solução:**
- Sempre fazer upload para Supabase Storage
- Não armazenar base64 no localStorage

## 📋 RECOMENDAÇÕES ADICIONAIS

### 16. **Implementar Content Security Policy (CSP)**
Adicionar headers CSP no `index.html` ou via servidor:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### 17. **Implementar HTTPS Obrigatório**
Garantir que todas as requisições usem HTTPS em produção.

### 18. **Adicionar Verificação de Integridade**
Implementar checksums ou hashes para verificar integridade de dados.

### 19. **Implementar Logging de Auditoria**
Registrar todas as ações administrativas para auditoria.

### 20. **Revisar Permissões do Supabase**
Garantir que Row Level Security (RLS) está configurado corretamente no Supabase.

## 🔧 PRIORIDADES DE CORREÇÃO

**URGENTE (Corrigir Imediatamente):**
1. Proteger acesso ao AdminDashboard
2. Sanitizar HTML do blog (XSS)
3. Remover exposição de chaves de API

**ALTA (Corrigir em 1-2 semanas):**
4. Implementar rate limiting
5. Validar uploads adequadamente
6. Mover dados sensíveis do localStorage

**MÉDIA (Corrigir em 1 mês):**
7. Implementar validação de sessão no backend
8. Melhorar tratamento de erros
9. Adicionar validação de schemas

**BAIXA (Melhorias contínuas):**
10. Implementar CSP
11. Adicionar logging de auditoria
12. Revisar permissões do Supabase

---

**Data do Relatório:** ${new Date().toLocaleDateString('pt-BR')}
**Versão Analisada:** 0.0.0 (package.json)


