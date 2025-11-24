/**
 * Serviço IndexNow
 * 
 * IndexNow é um protocolo que permite notificar motores de busca (Bing, Yandex, etc.)
 * sobre atualizações em páginas web, acelerando a indexação.
 * 
 * Documentação: https://www.indexnow.org/
 */

const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_KEY = 'd82af6a2f6ae3a28ff68b1f00aaabd87';
const SITE_HOST = 'botanicmd.com';
const KEY_LOCATION = `https://${SITE_HOST}/d82af6a2f6ae3a28ff68b1f00aaabd87.txt`;

interface IndexNowNotification {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/**
 * Notifica o IndexNow sobre URLs atualizadas
 * @param urls - Array de URLs completas (com https://) que foram atualizadas
 * @returns Promise<boolean> - true se a notificação foi enviada com sucesso
 */
export async function notifyIndexNow(urls: string[]): Promise<boolean> {
  if (!urls || urls.length === 0) {
    console.warn('IndexNow: Nenhuma URL fornecida para notificação');
    return false;
  }

  // Valida e normaliza URLs
  const validUrls = urls
    .map(url => {
      // Garante que a URL começa com https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${SITE_HOST}${url.startsWith('/') ? url : `/${url}`}`;
      }
      return url;
    })
    .filter(url => {
      // Valida se a URL pertence ao domínio correto
      try {
        const urlObj = new URL(url);
        return urlObj.hostname === SITE_HOST || urlObj.hostname === `www.${SITE_HOST}`;
      } catch {
        return false;
      }
    });

  if (validUrls.length === 0) {
    console.warn('IndexNow: Nenhuma URL válida para notificação');
    return false;
  }

  const notification: IndexNowNotification = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: validUrls,
  };

  try {
    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(notification),
    });

    // IndexNow retorna 200 (OK) ou 202 (Accepted) para sucesso
    if (response.ok || response.status === 202) {
      console.log(`IndexNow: Notificação enviada com sucesso para ${validUrls.length} URL(s)`);
      return true;
    } else {
      console.error(`IndexNow: Erro ao enviar notificação. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('IndexNow: Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Notifica o IndexNow sobre uma única URL atualizada
 * @param url - URL completa ou caminho relativo
 * @returns Promise<boolean>
 */
export async function notifyIndexNowSingle(url: string): Promise<boolean> {
  return notifyIndexNow([url]);
}

/**
 * Notifica o IndexNow sobre múltiplas páginas principais
 * Útil para notificar após atualizações importantes
 */
export async function notifyIndexNowMainPages(): Promise<boolean> {
  const mainPages = [
    `https://${SITE_HOST}/`,
    `https://${SITE_HOST}/app`,
    `https://${SITE_HOST}/blog`,
    `https://${SITE_HOST}/privacy`,
    `https://${SITE_HOST}/terms`,
  ];
  return notifyIndexNow(mainPages);
}

