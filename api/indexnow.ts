import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API Route para notificações IndexNow via servidor
 * 
 * POST /api/indexnow
 * 
 * Body:
 * {
 *   "urls": ["https://botanicmd.com/url1", "https://botanicmd.com/url2"]
 * }
 */
const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_KEY = 'd82af6a2f6ae3a28ff68b1f00aaabd87';
const SITE_HOST = 'botanicmd.com';
const KEY_LOCATION = `https://${SITE_HOST}/d82af6a2f6ae3a28ff68b1f00aaabd87.txt`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Provide an array of URLs in the body: { "urls": ["url1", "url2"] }' 
      });
    }

    // Valida e normaliza URLs
    const validUrls = urls
      .map((url: string) => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${SITE_HOST}${url.startsWith('/') ? url : `/${url}`}`;
        }
        return url;
      })
      .filter((url: string) => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname === SITE_HOST || urlObj.hostname === `www.${SITE_HOST}`;
        } catch {
          return false;
        }
      });

    if (validUrls.length === 0) {
      return res.status(400).json({ error: 'No valid URLs provided' });
    }

    // Prepara notificação IndexNow
    const notification = {
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: validUrls,
    };

    // Envia notificação para IndexNow
    const indexNowResponse = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(notification),
    });

    if (indexNowResponse.ok || indexNowResponse.status === 202) {
      return res.status(200).json({
        success: true,
        message: `IndexNow notified for ${validUrls.length} URL(s)`,
        urls: validUrls,
      });
    } else {
      return res.status(indexNowResponse.status).json({
        success: false,
        error: `IndexNow API returned status ${indexNowResponse.status}`,
        urls: validUrls,
      });
    }
  } catch (error: any) {
    console.error('IndexNow API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

