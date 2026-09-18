import { extractPayrollPdf } from './pdf-extractor.js';
import { buildOutputRows, exportWorkbook } from './export-xlsx.js';
import { calculateDueDate, formatDateBR } from './rules.js';
import { ProcessingLog } from './logger.js';
import { HOLIDAYS } from './holidays.js';

const fileInput = document.querySelector('#pdfFile');
const processBtn = document.querySelector('#processBtn');
const exportBtn = document.querySelector('#exportBtn');
const printBtn = document.querySelector('#printBtn');
const progress = document.querySelector('#progress');
const progressText = document.querySelector('#progressText');
const status = document.querySelector('#status');
const tbody = document.querySelector('#resultBody');
const subtotalCount = document.querySelector('#subtotalCount');
const summary = document.querySelector('#summary');

let currentResult = null;
let currentDueDate = null;
let currentLog = null;

function updateProgress({ phase, current, total, percent }) { progress.value = percent; progressText.textContent = `${phase} — ${current}/${total} — ${percent}%`; }
function money(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }

function render(result, dueDate, log) {
  const rows = buildOutputRows(result);
  tbody.innerHTML = '';
  for (const row of rows) {
    const tr = document.createElement('tr');
    if (row.TAG.length > 40) tr.classList.add('warning-row');
    for (const value of [row.Codigo, row['Tipo Inscrição'], row.Servico, row.TAG, row['Inscrição'], money(row.FGTS), money(row['FGTS Aprendiz']), money(row['Total FGTS'])]) {
      const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  subtotalCount.textContent = rows.length;
  summary.innerHTML = `<strong>Competência:</strong> ${result.competence?.label ?? 'não identificada'} &nbsp; | &nbsp; <strong>Vencimento:</strong> ${formatDateBR(dueDate)} &nbsp; | &nbsp; <strong>Serviços:</strong> ${rows.length} &nbsp; | &nbsp; <strong>Advertências:</strong> ${log.count('WARNING')} &nbsp; | &nbsp; <strong>Erros:</strong> ${log.count('ERROR')}`;
}

processBtn.addEventListener('click', async () => {
  const file = fileInput.files?.[0];
  if (!file) { status.textContent = 'Selecione um PDF antes de processar.'; return; }
  processBtn.disabled = true; exportBtn.disabled = true; printBtn.disabled = true;
  currentLog = new ProcessingLog(); status.textContent = 'Processamento iniciado.'; progress.value = 0;
  try {
    currentLog.info(`Arquivo selecionado: ${file.name}`);
    currentResult = await extractPayrollPdf(file, currentLog, updateProgress);
    if (!currentResult.competence) throw new Error('Não foi possível determinar a competência do extrato.');
    currentDueDate = calculateDueDate(currentResult.competence, HOLIDAYS);
    for (const row of buildOutputRows(currentResult)) {
      if (row.TAG.length > 40) currentLog.warn(`TAG excede 40 caracteres: ${row.TAG}`, { serviceCode: row.Codigo });
      const expected = row['Tipo Inscrição'] === 'CNPJ' ? 14 : 12;
      if (row['Inscrição'].length !== expected) currentLog.warn(`Inscrição inválida: ${row['Inscrição']}`, { serviceCode: row.Codigo });
    }
    updateProgress({ phase: 'Concluído', current: 1, total: 1, percent: 100 });
    render(currentResult, currentDueDate, currentLog); exportBtn.disabled = false; printBtn.disabled = false;
    status.textContent = currentLog.hasAdverse() ? 'Concluído com advertências. Confira o resumo e a aba Log no Excel.' : 'Concluído sem divergências detectadas.';
  } catch (error) { currentLog.error(error.message); status.textContent = `Falha no processamento: ${error.message}`; console.error(error); }
  finally { processBtn.disabled = false; }
});

exportBtn.addEventListener('click', () => { try { exportWorkbook(currentResult, currentDueDate, currentLog); } catch (error) { status.textContent = `Falha ao gerar Excel: ${error.message}`; } });
printBtn.addEventListener('click', () => window.print());
