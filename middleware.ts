import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 🔒 Middleware de Segurança para API Gemini
 * 
 * Bloqueia requisições suspeitas ANTES de chegarem na API,
 * economizando recursos e protegendo contra bots/scrapers.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Aplicar apenas para rotas de API sensíveis
  if (pathname.startsWith('/api/gemini')) {
    // 1. Bloquear user-agents suspeitos
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousAgents = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
      'python-requests', 'axios', 'postman', 'insomnia',
      'headless', 'phantom', 'selenium'
    ];
    
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      console.log(`🚫 Bloqueado: User-Agent suspeito: ${userAgent}`);
      return new NextResponse(
        JSON.stringify({ error: 'Acesso negado' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Exigir User-Agent (bots simples não enviam)
    if (!userAgent || userAgent.length < 10) {
      console.log('🚫 Bloqueado: User-Agent ausente ou inválido');
      return new NextResponse(
        JSON.stringify({ error: 'Requisição inválida' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verificar método HTTP (apenas POST é permitido)
    if (request.method !== 'POST' && request.method !== 'OPTIONS') {
      console.log(`🚫 Bloqueado: Método HTTP inválido: ${request.method}`);
      return new NextResponse(
        JSON.stringify({ error: 'Método não permitido' }), 
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verificar Origin header (proteção contra CSRF)
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const allowedOrigin = process.env.ALLOWED_ORIGIN;

    // Em produção, exigir Origin ou Referer
    if (process.env.NODE_ENV === 'production' && request.method === 'POST') {
      if (!origin && !referer) {
        console.log('🚫 Bloqueado: Origin e Referer ausentes');
        return new NextResponse(
          JSON.stringify({ error: 'Requisição inválida' }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se Origin/Referer corresponde ao permitido
      if (allowedOrigin && allowedOrigin !== '*') {
        const requestOrigin = origin || referer;
        if (requestOrigin && !requestOrigin.startsWith(allowedOrigin)) {
          console.log(`🚫 Bloqueado: Origin não permitida: ${requestOrigin}`);
          return new NextResponse(
            JSON.stringify({ error: 'Acesso negado' }), 
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 5. Log de requisição legítima (para monitoramento)
    console.log(`✅ Requisição permitida: ${request.method} ${pathname} from ${origin || referer || 'unknown'}`);
  }

  return NextResponse.next();
}

// Configurar matcher para aplicar apenas nas rotas desejadas
export const config = {
  matcher: [
    '/api/gemini/:path*',
    '/api/cron/:path*' // Também proteger cron jobs
  ],
};

