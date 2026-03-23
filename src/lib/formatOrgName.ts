const ORG_ABBR: [RegExp, string][] = [
  [/ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ/gi, 'ООО'],
  [/ОТКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО/gi, 'ОАО'],
  [/ЗАКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО/gi, 'ЗАО'],
  [/ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО/gi, 'ПАО'],
  [/АКЦИОНЕРНОЕ ОБЩЕСТВО/gi, 'АО'],
  [/ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ/gi, 'ИП'],
  [/НЕПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО/gi, 'НАО'],
  [/ПРОИЗВОДСТВЕННЫЙ КООПЕРАТИВ/gi, 'ПК'],
  [/ОБЩЕСТВО С ДОПОЛНИТЕЛЬНОЙ ОТВЕТСТВЕННОСТЬЮ/gi, 'ОДО'],
];

export function formatOrgName(name: string | null | undefined): string {
  if (!name) return '';
  let result = name.trim();
  for (const [pattern, abbr] of ORG_ABBR) {
    result = result.replace(pattern, abbr);
  }
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}
