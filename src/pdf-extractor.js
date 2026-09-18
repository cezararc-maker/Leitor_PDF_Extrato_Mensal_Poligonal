import { normalizeRegistration, parseBRL, parseCompetence } from './rules.js';

const SERVICE_RE = /Servi[cç]o:\s*(\d+)\s*-\s*(.*?)\s*-\s*(CNO|CNPJ):\s*([\d.\/-]+)/i;
const COMPANY_CNPJ_RE = /CNPJ:\s*(?:\n|\s)*([\d.]{2}\.?[\d.]{3}\.?[\d.]{3}\/?\d{4}-?\d{2})/i;

function normalizeText(text) {
  return text.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\r/g, '');
}

function itemPosition(item) {
  return { x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0 };
}

function extractCompetenceFromHeaderItems(items) {
  // Regra estrutural do relatório Domínio: na página 1, localizar o rótulo
  // "Competência:" no cabeçalho e ler somente o MM/AAAA visualmente à direita,
  // na mesma linha. Datas de emissão, admissão e demais datas são ignoradas.
  const label = items.find(item => /Compet[eê]ncia\s*:/i.test(item.str));
  if (!label) return null;
  const labelPos = itemPosition(label);
  const candidates = items
    .filter(item => /^\s*(0[1-9]|1[0-2])\/(20\d{2})\s*$/.test(item.str))
    .map(item => ({ item, ...itemPosition(item) }))
    .filter(candidate => candidate.x > labelPos.x && Math.abs(candidate.y - labelPos.y) <= 5)
    .sort((a, b) => a.x - b.x);
  return candidates.length ? parseCompetence(candidates[0].item.str.trim()) : null;
}

function findServiceTotal(block) {
  const summaryIndex = block.lastIndexOf('Resumo por Rubricas do Serviço');
  const liquidIndex = block.lastIndexOf('Líquido Serviço:');
  const start = Math.max(summaryIndex, liquidIndex, 0);
  const summary = block.slice(start);
  const fgts = summary.match(/\bValor do FGTS:\s*([\d.]+,\d{2})/i);
  const apprentice = summary.match(/\bValor do FGTS Aprendiz:\s*([\d.]+,\d{2})/i);
  return { fgts: fgts ? parseBRL(fgts[1]) : null, apprenticeFgts: apprentice ? parseBRL(apprentice[1]) : 0 };
}

function parseServiceBlock(headerMatch, block, page, log) {
  const [, code, serviceNameRaw, type, registrationRaw] = headerMatch;
  const registration = normalizeRegistration(registrationRaw, type);
  const totals = findServiceTotal(block);
  if (!registration.valid) log.warn(registration.reason, { serviceCode: code, page });
  if (totals.fgts === null) log.warn('Total "Valor do FGTS" não localizado no resumo do serviço.', { serviceCode: code, page });
  return { code: Number(code), registrationType: type.toUpperCase(), service: serviceNameRaw.trim(), registration: registration.value, fgts: totals.fgts ?? 0, apprenticeFgts: totals.apprenticeFgts, sourcePage: page };
}

export async function extractPayrollPdf(file, log, onProgress = () => {}) {
  if (!window.pdfjsLib) throw new Error('PDF.js não foi carregado. Verifique a conexão com a internet ou disponibilize a biblioteca localmente.');
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  let competence = null;
  let companyCnpj = '';

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const text = normalizeText(content.items.map(item => item.str).join(' '));
    pages.push({ pageNo, text });

    // A competência é lida exclusivamente do cabeçalho da primeira página.
    if (pageNo === 1) {
      competence = extractCompetenceFromHeaderItems(content.items);
      if (!competence) throw new Error('Não foi possível ler a competência à direita do campo "Competência:" no cabeçalho da página 1.');
      log.info(`Competência identificada no cabeçalho da página 1: ${competence.label}.`);
    }

    if (!companyCnpj) {
      const cnpjMatch = text.match(COMPANY_CNPJ_RE);
      if (cnpjMatch) companyCnpj = normalizeRegistration(cnpjMatch[1], 'CNPJ').value;
    }
    onProgress({ phase: 'Lendo PDF', current: pageNo, total: pdf.numPages, percent: Math.round((pageNo / pdf.numPages) * 55) });
  }

  const fullText = pages.map(p => `\n[[PAGE:${p.pageNo}]]\n${p.text}`).join('\n');
  const matches = [...fullText.matchAll(new RegExp(SERVICE_RE.source, 'gi'))];
  if (!matches.length) throw new Error('Nenhum cabeçalho "Serviço" com CNO/CNPJ foi localizado no PDF.');

  const services = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const block = fullText.slice(current.index, next ? next.index : fullText.length);
    const pagePrefix = fullText.slice(0, current.index);
    const pageMatches = [...pagePrefix.matchAll(/\[\[PAGE:(\d+)\]\]/g)];
    const pageNo = pageMatches.length ? Number(pageMatches.at(-1)[1]) : 1;
    services.push(parseServiceBlock(current, block, pageNo, log));
    onProgress({ phase: 'Extraindo serviços', current: i + 1, total: matches.length, percent: 55 + Math.round(((i + 1) / matches.length) * 35) });
  }

  const consolidated = new Map();
  for (const item of services) {
    const key = `${item.code}|${item.registrationType}|${item.registration}`;
    const existing = consolidated.get(key);
    if (!existing || item.fgts !== 0 || existing.fgts === 0) consolidated.set(key, item);
  }

  onProgress({ phase: 'Validando resultado', current: 1, total: 1, percent: 95 });
  log.info(`${consolidated.size} serviço(s) consolidado(s) extraído(s).`);
  return { competence, companyCnpj, services: [...consolidated.values()].sort((a, b) => a.code - b.code), pageCount: pdf.numPages };
}
