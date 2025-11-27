/**
 * Gera um slug amigável para URLs a partir de um título
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove acentos e caracteres especiais
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Substitui espaços e caracteres especiais por hífens
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // Remove hífens no início e fim
    .replace(/^-+|-+$/g, '');
}

/**
 * Gera um slug único combinando título e ID
 */
export function generateUniqueSlug(title: string, id: number): string {
  const baseSlug = generateSlug(title);
  return `${baseSlug}-${id}`;
}

