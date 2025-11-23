# 🔧 Configuração da API Gemini

## ⚠️ Erro: API não encontrada (404)

Se você está vendo o erro `api/gemini:1 Failed to load resource: the server responded with a status of 404`, isso significa que a API route não está funcionando em desenvolvimento local.

## ✅ Solução

### Opção 1: Usar o script atualizado (Recomendado)

Os scripts `iniciar.bat` e `iniciar.ps1` foram atualizados para iniciar automaticamente:
1. **Servidor de API** na porta 3001
2. **Servidor Frontend** na porta 3000

Basta executar:
```bash
# Windows
iniciar.bat

# PowerShell
.\iniciar.ps1
```

### Opção 2: Manual

1. **Terminal 1 - Servidor de API:**
   ```bash
   npm run dev:api
   ```

2. **Terminal 2 - Servidor Frontend:**
   ```bash
   npm run dev
   ```

### Opção 3: Ambos juntos
```bash
npm run dev:all
```

## 🔑 Configurar Chave da API Gemini

1. **Crie um arquivo `.env.local` na raiz do projeto:**
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```

2. **Obtenha sua chave em:**
   - https://makersuite.google.com/app/apikey
   - Ou https://aistudio.google.com/app/apikey

3. **Reinicie os servidores** após criar o arquivo

## 📝 Notas

- O servidor de API (`api-server.js`) é apenas para **desenvolvimento local**
- Em **produção no Vercel**, as API routes funcionam automaticamente
- A chave `GEMINI_API_KEY` deve estar no `.env.local` para desenvolvimento
- No Vercel, configure `GEMINI_API_KEY` nas variáveis de ambiente do projeto

## 🔍 Verificar se está funcionando

1. Abra o console do navegador (F12)
2. Tente fazer upload de uma imagem
3. Se ainda aparecer erro 404, verifique:
   - O servidor de API está rodando na porta 3001?
   - O arquivo `.env.local` existe e tem a chave?
   - Os servidores foram reiniciados após criar o `.env.local`?

## 🚨 Erros Comuns

### "GEMINI_API_KEY não configurada"
- **Solução:** Crie o arquivo `.env.local` com sua chave

### "Porta 3001 já está em uso"
- **Solução:** Feche outros programas usando a porta 3001

### "Cannot find module"
- **Solução:** Execute `npm install` novamente

---

**Dica:** Use `npm run dev:all` para iniciar ambos os servidores automaticamente!

