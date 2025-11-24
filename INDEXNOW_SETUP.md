# 🔍 Configuração do IndexNow

O IndexNow é um protocolo que permite notificar motores de busca (Bing, Yandex, Naver, Seznam.cz) sobre atualizações em páginas web, acelerando a indexação.

## 📋 O que foi configurado

### 1. Arquivo de Chave
- **Localização**: `/public/d82af6a2f6ae3a28ff68b1f00aaabd87.txt`
- **Acesso**: https://botanicmd.com/d82af6a2f6ae3a28ff68b1f00aaabd87.txt
- **Conteúdo**: A chave de autenticação do IndexNow

### 2. Serviço TypeScript
- **Arquivo**: `services/indexNowService.ts`
- **Funções disponíveis**:
  - `notifyIndexNow(urls: string[])` - Notifica múltiplas URLs
  - `notifyIndexNowSingle(url: string)` - Notifica uma única URL
  - `notifyIndexNowMainPages()` - Notifica as páginas principais

### 3. API Route (Opcional)
- **Endpoint**: `/api/indexnow`
- **Método**: POST
- **Uso**: Para notificações via servidor

## 🚀 Como Usar

### No Cliente (Frontend)

```typescript
import { notifyIndexNowSingle, notifyIndexNow } from '../services/indexNowService';

// Notificar uma única página atualizada
await notifyIndexNowSingle('https://botanicmd.com/blog/nova-postagem');

// Notificar múltiplas páginas
await notifyIndexNow([
  'https://botanicmd.com/blog/post-1',
  'https://botanicmd.com/blog/post-2',
]);

// Notificar páginas principais (útil após grandes atualizações)
await notifyIndexNowMainPages();
```

### Via API Route (Servidor)

```bash
# Exemplo com curl
curl -X POST https://botanicmd.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://botanicmd.com/blog/nova-postagem",
      "https://botanicmd.com/app"
    ]
  }'
```

### Exemplo: Notificar após criar nova postagem no blog

```typescript
// Após criar uma nova postagem
const newPostUrl = `https://botanicmd.com/blog/${postSlug}`;

// Notifica o IndexNow
await notifyIndexNowSingle(newPostUrl);
```

## 📝 Quando Notificar

Notifique o IndexNow sempre que:

1. ✅ **Nova página publicada** (blog post, nova seção, etc.)
2. ✅ **Conteúdo atualizado** (edição de página existente)
3. ✅ **URLs removidas** (notificar remoção ajuda os motores de busca)
4. ✅ **Grandes atualizações** (redesign, nova estrutura)

## ⚠️ Limites e Boas Práticas

- **Não notifique URLs muito frequentemente** - IndexNow é para mudanças significativas
- **Valide URLs** - O serviço já valida automaticamente
- **Use HTTPS** - URLs devem usar HTTPS
- **Um domínio = uma chave** - Esta chave é válida apenas para `botanicmd.com`

## 🔧 Configuração Técnica

### Chave IndexNow
- **Chave**: `d82af6a2f6ae3a28ff68b1f00aaabd87`
- **Arquivo de chave**: https://botanicmd.com/d82af6a2f6ae3a28ff68b1f00aaabd87.txt
- **Host**: `botanicmd.com`

### Verificação da Chave

A chave deve estar acessível em:
```
https://botanicmd.com/d82af6a2f6ae3a28ff68b1f00aaabd87.txt
```

### Motores de Busca Suportados

O IndexNow é suportado por:
- ✅ Bing
- ✅ Yandex
- ✅ Naver
- ✅ Seznam.cz
- ⏳ Google (em consideração)

## 📚 Recursos Adicionais

- [IndexNow.org](https://www.indexnow.org/)
- [Documentação IndexNow](https://www.indexnow.org/documentation)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)

---

💡 **Dica**: O IndexNow é gratuito e não requer autenticação adicional nos motores de busca, mas recomendamos também usar o Google Search Console e Bing Webmaster Tools para monitoramento completo.

