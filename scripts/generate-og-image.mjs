#!/usr/bin/env node

/**
 * Script para gerar og-image.jpg automaticamente
 * 
 * Requisitos:
 * npm install puppeteer
 * 
 * Uso:
 * node scripts/generate-og-image.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateOGImage() {
  try {
    console.log('🚀 Iniciando geração da og-image.jpg...\n');
    
    // Verifica se puppeteer está instalado
    let puppeteer;
    try {
      puppeteer = await import('puppeteer');
    } catch (e) {
      console.error('❌ Erro: puppeteer não está instalado.');
      console.error('   Execute: npm install puppeteer\n');
      console.log('💡 Alternativa: Use o arquivo public/generate-og-image.html');
      console.log('   Abra no navegador e faça screenshot manualmente.\n');
      process.exit(1);
    }

    // Lê o template HTML
    const templatePath = join(__dirname, '..', 'public', 'og-image-template.html');
    const html = readFileSync(templatePath, 'utf-8');

    console.log('📄 Template HTML carregado');
    console.log('🌐 Iniciando navegador...');

    // Inicia o navegador
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Define o viewport para 1200x630
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2 // Para melhor qualidade
    });

    console.log('📝 Carregando HTML...');
    
    // Carrega o HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Aguarda um pouco para garantir que tudo está renderizado
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📸 Capturando screenshot...');

    // Tira o screenshot
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      fullPage: false
    });

    // Salva o arquivo
    const outputPath = join(__dirname, '..', 'public', 'og-image.jpg');
    writeFileSync(outputPath, screenshot);

    console.log('✅ Imagem gerada com sucesso!');
    console.log(`   Localização: ${outputPath}\n`);

    await browser.close();

    console.log('🎉 Concluído! A og-image.jpg está pronta para uso.\n');
    console.log('💡 Próximos passos:');
    console.log('   1. Teste no Facebook: https://developers.facebook.com/tools/debug/');
    console.log('   2. Teste no Twitter: https://cards-dev.twitter.com/validator');
    console.log('   3. Faça deploy para ver a imagem funcionando!\n');

  } catch (error) {
    console.error('❌ Erro ao gerar imagem:', error.message);
    console.error('\n💡 Alternativa: Use o arquivo public/generate-og-image.html');
    console.error('   Abra no navegador e faça screenshot manualmente.\n');
    process.exit(1);
  }
}

// Executa
generateOGImage();

