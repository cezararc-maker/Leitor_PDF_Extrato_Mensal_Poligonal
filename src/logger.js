export class ProcessingLog {
  constructor() { this.items = []; }
  add(level, message, context = {}) {
    this.items.push({ timestamp: new Date().toISOString(), level, message, ...context });
  }
  info(message, context) { this.add('INFO', message, context); }
  warn(message, context) { this.add('WARNING', message, context); }
  error(message, context) { this.add('ERROR', message, context); }
  count(level) { return this.items.filter(item => item.level === level).length; }
  hasAdverse() { return this.items.some(item => item.level === 'WARNING' || item.level === 'ERROR'); }
  toRows() { return this.items.map(i => ({ DataHora: i.timestamp, Nivel: i.level, Mensagem: i.message, Servico: i.serviceCode ?? '', Pagina: i.page ?? '' })); }
}
