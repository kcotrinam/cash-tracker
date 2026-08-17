export function normalizeCategoryName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
    .trim()
    .replace(/\s+/g, ' ');
}

export function displayCategoryName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}
