import { buildTag, formatDateBR } from './rules.js';

export function buildOutputRows(result) {
  return result.services.map(item => ({
    Codigo: item.code,
    'Tipo Inscrição': item.registrationType,
    Servico: item.service,
    TAG: buildTag(item.code, item.service, item.registration),
    'Inscrição': item.registration,
    FGTS: item.fgts,
    'FGTS Aprendiz': item.apprenticeFgts,
    'Total FGTS': item.fgts + item.apprenticeFgts
  }));
}

export function exportWorkbook(result, dueDate, log) {
  if (!window.XLSX) throw new Error('SheetJS não foi carregado.');
  const rows = buildOutputRows(result);
  const wb = XLSX.utils.book_new();
  const headerRows = [
    ['Competência', result.competence?.label ?? '', '', 'Vencimento', formatDateBR(dueDate)],
    [],
    ['Codigo', 'Tipo Inscrição', 'Servico', 'TAG', 'Inscrição', 'FGTS', 'FGTS Aprendiz', 'Total FGTS']
  ];
  const dataRows = rows.map(r => [r.Codigo, r['Tipo Inscrição'], r.Servico, r.TAG, r['Inscrição'], r.FGTS, r['FGTS Aprendiz'], null]);
  const subtotalRow = dataRows.length + 4;
  const sheetData = [...headerRows, ...dataRows, ['Subtotal', null, null, null, null, null, null, null]];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  for (let row = 4; row <= dataRows.length + 3; row++) {
    const inscription = ws[`E${row}`];
    if (inscription) { inscription.t = 's'; inscription.z = '@'; inscription.v = String(inscription.v); }
    for (const col of ['F', 'G']) {
      const money = ws[`${col}${row}`];
      if (money) money.z = '#,##0.00';
    }
    // Total FGTS permanece como fórmula no Excel: FGTS + FGTS Aprendiz.
    ws[`H${row}`] = { t: 'n', f: `SUM(F${row}:G${row})`, z: '#,##0.00' };
  }

  // SUBTOTAL 103 = COUNTA ignorando linhas filtradas e também linhas ocultadas manualmente.
  // Assim o contador mostra somente quantos serviços estão visíveis naquele momento.
  ws[`A${subtotalRow}`] = { t: 's', v: 'Subtotal' };
  ws[`B${subtotalRow}`] = { t: 'n', f: `SUBTOTAL(103,A4:A${dataRows.length + 3})` };

  ws['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 42 }, { wch: 42 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  ws['!autofilter'] = { ref: `A3:H${Math.max(3, dataRows.length + 3)}` };
  XLSX.utils.book_append_sheet(wb, ws, 'FGTS por Obra');

  if (log.items.length) {
    const logWs = XLSX.utils.json_to_sheet(log.toRows());
    logWs['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 70 }, { wch: 12 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, logWs, 'Log');
  }

  const suffix = result.competence ? `${String(result.competence.month).padStart(2, '0')}${result.competence.year}` : 'resultado';
  XLSX.writeFile(wb, `FGTS_Extrator_${suffix}.xlsx`, { compression: true });
}
