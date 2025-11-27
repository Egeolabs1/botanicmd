# 📸 Como Criar a og-image.jpg

## 🎯 Objetivo
Criar uma imagem Open Graph de 1200x630px para melhorar o compartilhamento nas redes sociais.

## 🚀 Métodos Disponíveis

### Método 1: Usando o Template HTML (Recomendado)

1. **Abra o arquivo:**
   ```
   public/og-image-template.html
   ```

2. **Use uma das ferramentas abaixo:**

   #### Opção A: htmlcsstoimage.com (Mais fácil)
   - Acesse: https://htmlcsstoimage.com
   - Copie TODO o conteúdo do arquivo `og-image-template.html`
   - Cole no editor da ferramenta
   - Configure: 1200x630px
   - Baixe a imagem
   - Salve como `og-image.jpg` em `public/`

   #### Opção B: Screenshot Manual
   - Abra `public/generate-og-image.html` no navegador
   - Use uma extensão de screenshot (GoFullPage, Awesome Screenshot)
   - Ou use DevTools (F12) → Device Toolbar → Configure para 1200x630px
   - Faça screenshot
   - Salve como `og-image.jpg` em `public/`

   #### Opção C: Puppeteer/Playwright (Desenvolvedores)
   ```bash
   npm install puppeteer
   node scripts/generate-og-image.js
   ```

### Método 2: Usando Ferramentas de Design

#### Canva (Mais fácil para não-desenvolvedores)
1. Acesse: https://www.canva.com
2. Crie um design de 1200x630px
3. Use o template "Open Graph Image"
4. Adicione:
   - Logo BotanicMD (ícone verde + texto)
   - Texto: "AI-Powered Plant Identification"
   - Cores: Verde (#22c55e) como fundo
   - Estatísticas: 1M+ Plants, 98% Accuracy, 10k+ Users
5. Baixe como JPG
6. Salve em `public/og-image.jpg`

#### Figma/Photoshop
- Crie um canvas de 1200x630px
- Use o design do template HTML como referência
- Exporte como JPG
- Salve em `public/og-image.jpg`

## 📋 Checklist

- [ ] Imagem criada com dimensões exatas: **1200x630px**
- [ ] Formato: **JPG** (ou PNG se preferir)
- [ ] Arquivo salvo em: `public/og-image.jpg`
- [ ] Tamanho do arquivo: < 1MB (otimizado)
- [ ] Contém logo BotanicMD
- [ ] Texto legível e claro
- [ ] Cores consistentes com a marca

## ✅ Verificação

Após criar a imagem, verifique:

1. **Arquivo existe:**
   ```bash
   ls public/og-image.jpg
   ```

2. **Teste no Facebook:**
   - https://developers.facebook.com/tools/debug/
   - Cole: https://botanicmd.com
   - Clique em "Scrape Again"
   - Verifique se a imagem aparece

3. **Teste no Twitter:**
   - https://cards-dev.twitter.com/validator
   - Cole: https://botanicmd.com
   - Verifique o preview

4. **Teste no LinkedIn:**
   - Compartilhe o link
   - Verifique se a imagem aparece

## 🎨 Design Sugerido

O template HTML já contém o design ideal:
- **Fundo:** Gradiente verde (#22c55e → #16a34a)
- **Logo:** Ícone branco em quadrado branco arredondado + texto "BotanicMD"
- **Tagline:** "Identify, Diagnose, Heal."
- **Título:** "AI-Powered Plant Identification"
- **Estatísticas:** 1M+ Plants, 98% Accuracy, 10k+ Users

## 🔧 Troubleshooting

### Imagem não aparece no Facebook/Twitter?
- Aguarde alguns minutos (cache)
- Use as ferramentas de debug acima para forçar atualização
- Verifique se o arquivo está em `public/og-image.jpg`
- Verifique se o servidor está servindo o arquivo corretamente

### Imagem muito grande?
- Use uma ferramenta de compressão: https://tinypng.com
- Ou: https://squoosh.app
- Meta: < 1MB

### Imagem não está no formato correto?
- Use um conversor online: https://convertio.co
- Ou use ImageMagick: `convert og-image.png og-image.jpg`

---

**Dica:** O método mais rápido é usar htmlcsstoimage.com com o template HTML fornecido!

