# Debug de Sessão - BotanicMD

## Problema: Usuário desloga ao atualizar a página

### Checklist de Verificação:

1. **Verificar se Supabase está configurado:**
   - Abra o console do navegador (F12)
   - Procure por mensagens sobre Supabase
   - Se aparecer "Supabase não configurado", verifique as variáveis de ambiente

2. **Verificar localStorage:**
   ```javascript
   // No console do navegador:
   localStorage.getItem('botanicmd-auth-token')
   // Deve retornar um objeto JSON com access_token e refresh_token
   ```

3. **Verificar sessão do Supabase:**
   ```javascript
   // No console do navegador após fazer login:
   const { supabase } = await import('./services/supabase');
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Sessão atual:', session);
   ```

4. **Logs importantes:**
   - "Auth state changed:" - mostra mudanças na autenticação
   - "✅ Sessão encontrada no localStorage" - confirma que a sessão foi salva
   - "ℹ️ Nenhuma sessão encontrada no localStorage" - indica que não há sessão salva

### Possíveis Causas:

1. **Supabase não configurado:**
   - Verifique `.env.local` ou variáveis de ambiente no Vercel
   - Variáveis necessárias: `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`

2. **localStorage sendo limpo:**
   - Verifique se há extensões do navegador limpando dados
   - Modo privado/incógnito não persiste localStorage

3. **Token expirado:**
   - O `autoRefreshToken` deve renovar automaticamente
   - Se não estiver funcionando, pode ser problema de CORS

4. **Domínio diferente:**
   - Se estiver em `localhost` e depois em produção, a sessão não persiste entre domínios

### Solução de Teste:

1. Faça login
2. Abra o console (F12)
3. Verifique: `localStorage.getItem('botanicmd-auth-token')`
4. Atualize a página (F5)
5. Verifique os logs no console
6. Verifique se a sessão foi recuperada

### Se ainda não funcionar:

1. Limpe o localStorage e tente novamente:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. Verifique se as variáveis de ambiente estão sendo carregadas:
   ```javascript
   console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('KEY:', import.meta.env.VITE_SUPABASE_KEY ? 'Configurada' : 'Não configurada');
   ```

