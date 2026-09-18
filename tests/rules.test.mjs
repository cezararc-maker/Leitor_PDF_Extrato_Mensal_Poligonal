import assert from 'node:assert/strict';
import { buildTag, calculateDueDate, formatDateBR, normalizeRegistration, parseCompetence } from '../src/rules.js';

assert.deepEqual(parseCompetence('Competência: 08/2026'), { month: 8, year: 2026, label: '08/2026' });
assert.equal(formatDateBR(calculateDueDate('08/2026', [])), '18/09/2026');
assert.equal(normalizeRegistration('03.492.162/0001-82', 'CNPJ').value, '03492162000182');
assert.equal(normalizeRegistration('900249746773', 'CNO').value, '900249746773');
const tag = buildTag(80, 'POSTO FISCAL BRASILANDIA CONT 0', '900249746773');
assert.ok(tag.length <= 40);
assert.ok(tag.endsWith('900249746773'));
console.log('Todos os testes de regras passaram.');
