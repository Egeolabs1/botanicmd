<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BotanicMD - Assistente Botânico com IA

BotanicMD é um aplicativo web PWA (Progressive Web App) para identificação e diagnóstico de plantas usando inteligência artificial. Identifique plantas por foto ou nome, diagnostique problemas de saúde e receba recomendações de cuidados especializados.

## 🚀 Funcionalidades

- 🔍 **Identificação de Plantas**: Por foto ou busca por nome usando IA Gemini
- 💊 **Diagnóstico de Saúde**: Análise de doenças, pragas e deficiências
- 📚 **Guias de Cuidados**: Água, luz, solo, temperatura e propagação
- 🌿 **Meu Jardim**: Salve e organize suas plantas identificadas (Pro)
- 📖 **Blog Botânico**: Artigos e dicas sobre cuidados de plantas
- 🌞 **Luxômetro**: Medição de luz para posicionamento de plantas
- 🌍 **Multi-idioma**: Suporte para 7 idiomas (PT, EN, FR, DE, ES, RU, HI)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Google AI Studio (para API Key do Gemini)
- (Opcional) Projeto no Supabase (para autenticação e armazenamento)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd botanicmd
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

#### Para Desenvolvimento Local

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Google Gemini API Key (Obrigatório)
# Obtenha em: https://ai.google.dev/
# Para desenvolvimento local, você pode usar VITE_ (mas NÃO faça isso em produção!)
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui

# Supabase Configuration (Opcional - para autenticação e armazenamento)
# Se não configurado, o app funcionará em modo demo/offline
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_KEY=sua_chave_supabase_aqui
```

#### Para Produção no Vercel

**🔒 IMPORTANTE: Segurança da API Key**

Para produção, a API Key da Gemini deve ser configurada **SEM o prefixo `VITE_`** no Vercel Dashboard para manter a chave segura no servidor.

Veja o guia completo em [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)

**Resumo rápido:**
1. Acesse Vercel Dashboard → Settings → Environment Variables
2. Adicione `GEMINI_API_KEY` (SEM `VITE_`) com sua chave
3. Marque todos os ambientes (Production, Preview, Development)
4. Faça redeploy

**Notas importantes:**
- `GEMINI_API_KEY` (sem `VITE_`) é **obrigatória** para funcionalidades de IA em produção
- A chave fica segura no servidor (não exposta no cliente)
- Supabase é **opcional**, mas recomendado para produção
- Sem Supabase, o app funcionará em modo demo/offline com LocalStorage

### 4. Execute o aplicativo

```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`

```bash
npm run preview
```

## ⚙️ Configuração do Supabase (Opcional)

Para usar autenticação e armazenamento em nuvem:

### 🚀 Guia Rápido

**Para uma configuração completa passo a passo, veja:**
- **[CONFIGURAR_SUPABASE_COMPLETO.md](./CONFIGURAR_SUPABASE_COMPLETO.md)** - Guia completo do zero

### 📋 Resumo das Etapas

1. **Obter credenciais** no Supabase Dashboard (Settings → API)
2. **Configurar variáveis** `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` no Vercel
3. **Executar script SQL** para criar tabela e políticas (veja `supabase-setup.sql`)
4. **Criar bucket** `plant-images` no Storage (público)
5. **Configurar políticas** de Storage (veja `supabase-storage-setup.sql`)

### 📄 Scripts SQL Disponíveis

- **`supabase-setup.sql`** - Cria tabela `plants` e políticas RLS
- **`supabase-storage-setup.sql`** - Configura políticas de Storage

### 📚 Documentação Adicional

- **[SUPABASE_CHECKLIST.md](./SUPABASE_CHECKLIST.md)** - Checklist detalhado para verificação
- **[SUPABASE_OAUTH_SETUP.md](./SUPABASE_OAUTH_SETUP.md)** - Guia para configurar Google OAuth
- **[CONFIGURAR_SUPABASE_COMPLETO.md](./CONFIGURAR_SUPABASE_COMPLETO.md)** - Guia passo a passo completo

## 📦 Tecnologias Utilizadas

- **React 19.2** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Google Gemini 3.0 Flash** - IA para análise de plantas
- **Supabase** - Backend (Auth + Database + Storage)
- **Tailwind CSS** - Estilização (via classes utilitárias)

## 🏗️ Estrutura do Projeto

```
botanicmd/
├── components/          # Componentes React
│   ├── LandingPage.tsx
│   ├── ResultCard.tsx
│   ├── UploadSection.tsx
│   └── ...
├── services/           # Lógica de negócio
│   ├── geminiService.ts      # Integração com IA Gemini
│   ├── supabase.ts           # Cliente Supabase
│   ├── storageService.ts     # Gerenciamento de plantas
│   ├── storageUploadService.ts # Upload de imagens
│   ├── imageService.ts       # Compressão e processamento
│   └── ...
├── contexts/          # Context API
│   └── AuthContext.tsx
├── i18n.tsx          # Internacionalização
├── types.ts          # Definições TypeScript
└── App.tsx           # Componente principal
```

## 🔒 Segurança

- ✅ Credenciais não são hardcoded no código
- ✅ Variáveis de ambiente obrigatórias para APIs
- ✅ Validação de inputs e respostas da IA
- ✅ Row Level Security (RLS) no Supabase
- ✅ Compressão de imagens antes do upload
- ✅ Validação de tamanho de arquivo (max 5MB)

## 🐛 Resolução de Problemas

### Erro: "Gemini API não está configurada"
- Verifique se `GEMINI_API_KEY` está configurada no Vercel (produção) ou `.env.local` (desenvolvimento)
- Veja [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) para instruções detalhadas
- Reinicie o servidor de desenvolvimento após criar/editar `.env.local`

### Erro: "Supabase não configurado"
- Este é um aviso, não um erro. O app funcionará em modo demo/offline
- Para usar Supabase, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`

### Imagens não fazem upload
- Verifique se o bucket `plant-images` existe no Supabase Storage
- Configure o bucket como público
- Verifique as políticas de acesso do bucket

## 📝 Licença

Este projeto está sob licença MIT.

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

Desenvolvido por Egeolabs 2025
