export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export function normalizeRegistration(value, type = '') {
  const digits = onlyDigits(value);
  const normalizedType = String(type).toUpperCase();
  const expected = normalizedType === 'CNPJ' ? 14 : normalizedType === 'CNO' ? 12 : null;
  if (!expected) return { value: digits, valid: false, reason: 'Tipo de inscrição não reconhecido.' };
  return {
    value: digits.padStart(expected, '0').slice(-expected),
    valid: digits.length === expected,
    reason: digits.length === expected ? '' : `${normalizedType} deve possuir ${expected} dígitos.`
  };
}

export function buildTag(code, service, registration) {
  const prefix = `${String(code).trim()}-${String(service).trim()}`.slice(0, 27).trimEnd();
  const reg = onlyDigits(registration);
  let tag = `${prefix} ${reg}`.trim();
  if (tag.length > 40) {
    const available = Math.max(0, 40 - reg.length - 1);
    tag = `${prefix.slice(0, available).trimEnd()} ${reg}`.trim();
  }
  return tag;
}

export function parseCompetence(value) {
  const match = String(value).match(/\b(0[1-9]|1[0-2])\/(20\d{2})\b/);
  if (!match) return null;
  return { month: Number(match[1]), year: Number(match[2]), label: `${match[1]}/${match[2]}` };
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateDueDate(competence, holidays = []) {
  const comp = typeof competence === 'string' ? parseCompetence(competence) : competence;
  if (!comp) throw new Error('Competência inválida para cálculo do vencimento.');
  const date = new Date(comp.year, comp.month, 20, 12, 0, 0); // month is 1-based; JS advances to next month.
  const holidaySet = new Set(holidays);
  while (date.getDay() === 0 || date.getDay() === 6 || holidaySet.has(isoDate(date))) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}

export function formatDateBR(date) {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function parseBRL(value = '0') {
  const normalized = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}
