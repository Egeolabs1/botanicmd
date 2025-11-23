# 🚀 Guia de Instalação e Execução - BotanicMD

## Pré-requisitos

1. **Node.js** (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Instale a versão LTS (recomendada)

2. **npm** (vem junto com o Node.js)

## 📦 Instalação Rápida

### Opção 1: Usando Scripts Automáticos (Recomendado)

#### Windows (Batch):
```bash
# Instalar dependências
instalar.bat

# Iniciar servidor
iniciar.bat
```

#### Windows (PowerShell):
```powershell
# Instalar dependências e iniciar servidor
.\iniciar.ps1
```

### Opção 2: Manual

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Abrir no navegador:**
   - O servidor estará disponível em: `http://localhost:3000`
   - O Vite abrirá automaticamente ou você pode abrir manualmente

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia apenas o frontend (porta 3000)
npm run dev:api      # Inicia apenas o servidor de API (porta 3001)
npm run dev:all      # Inicia ambos os servidores (recomendado)

# Build para produção
npm run build        # Cria build otimizado na pasta 'dist'

# Preview do build
npm run preview      # Visualiza o build de produção localmente
```

## 🔑 Configurar API Gemini

Para usar as funcionalidades de IA, você precisa configurar a chave da API Gemini:

1. **Crie um arquivo `.env.local` na raiz do projeto:**
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```

2. **Obtenha sua chave em:**
   - https://makersuite.google.com/app/apikey
   - Ou https://aistudio.google.com/app/apikey

3. **Reinicie os servidores** após criar o arquivo

📖 **Mais detalhes:** Veja `CONFIGURACAO_API.md`

## 🌐 Acessar o Site

Após iniciar o servidor, acesse:
- **Local:** http://localhost:3000
- **Rede local:** O Vite mostrará o IP da rede (se usar --host)

## ⚠️ Solução de Problemas

### Erro: "npm não é reconhecido"
- **Solução:** Instale o Node.js de https://nodejs.org/
- Reinicie o terminal após a instalação

### Erro: "Porta 3000 já está em uso"
- **Solução:** Feche outros programas usando a porta 3000
- Ou altere a porta no `vite.config.ts`

### Erro ao instalar dependências
- **Solução:** 
  ```bash
  # Limpar cache e reinstalar
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ```

### Dependências não instaladas
- **Solução:** Execute `npm install` manualmente antes de iniciar

## 📝 Notas Importantes

1. **Primeira execução:** As dependências serão instaladas automaticamente
2. **Modo desenvolvimento:** O servidor recarrega automaticamente ao salvar arquivos
3. **Porta padrão:** 3000 (configurável no `vite.config.ts`)

## 🔒 Segurança

Todas as correções de segurança foram aplicadas:
- ✅ XSS protegido
- ✅ Chaves de API seguras
- ✅ Validações implementadas
- ✅ Rate limiting ativo
- ✅ CORS configurado

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o Node.js está instalado: `node --version`
2. Verifique se o npm está instalado: `npm --version`
3. Execute `npm install` manualmente
4. Verifique os logs de erro no terminal

---

**Desenvolvido com ❤️ para BotanicMD**


