# ⚠️ Avisos do npm - Documentação

## Aviso: `node-domexception@1.0.0` deprecated

### O que é?
Este aviso aparece durante `npm install` e indica que uma dependência transitiva está usando uma versão antiga do pacote `node-domexception`.

### Por que acontece?
A cadeia de dependências é:
```
@google/genai → google-auth-library → gaxios → node-fetch → fetch-blob → node-domexception
```

### É um problema?
**Não!** Este aviso é apenas informativo e **não afeta o funcionamento** da aplicação.

### Por que podemos ignorar?
1. **Node.js 18+ tem DOMException nativo**: Se você está usando Node.js 18 ou superior (você está usando v24.11.1), o `DOMException` já está disponível nativamente.
2. **É uma dependência transitiva**: Não controlamos diretamente essa dependência - ela vem do `@google/genai`.
3. **Não quebra nada**: O aviso não impede a instalação ou execução do projeto.

### Solução
**Nenhuma ação necessária!** O aviso pode ser ignorado com segurança.

### Quando será resolvido?
Quando o Google atualizar o pacote `@google/genai` e suas dependências para usar a implementação nativa do Node.js ou remover a dependência de `node-domexception`.

### Como suprimir o aviso (opcional)
Se o aviso estiver incomodando, você pode suprimi-lo temporariamente:

```bash
npm install --no-warn-deprecated
```

Ou adicionar ao `.npmrc`:
```
warn-deprecated=false
```

**Nota**: Não recomendamos suprimir avisos, mas se necessário, essa é uma opção.

---

**Última atualização**: ${new Date().toLocaleDateString('pt-BR')}

