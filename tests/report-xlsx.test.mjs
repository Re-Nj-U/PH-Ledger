import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { reportWorkbook, reportXlsx } from '../lib/report-xlsx.ts';
import { monthlyReport } from '../lib/report.ts';

const settings = { name: 'Test Holidays', startDate: '2026-10-01', openingCash: 0, reserve: 0 };
const trip = { id: 'private-trip-id', kind: 'trip', name: '=HYPERLINK("https://example.com")', customer: 'Customer', vehicleId: 'v', start: '2026-10-18', end: '2026-10-19', odoStart: 100, odoEnd: 200, amount: 1000000, status: 'completed', notes: '<Private> & notes' };
const vehicle = { id: 'v', kind: 'vehicle', name: 'Van', registration: 'TEST' };
const report = monthlyReport([vehicle, trip], settings, '2026-10');
function files(bytes) {
    const found = {}, view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let at = 0;
    while (view.getUint32(at, true) === 0x04034b50) {
        assert.equal(view.getUint16(at + 8, true), 0);
        const size = view.getUint32(at + 18, true), nameLength = view.getUint16(at + 26, true), extra = view.getUint16(at + 28, true);
        const name = new TextDecoder().decode(bytes.subarray(at + 30, at + 30 + nameLength));
        const start = at + 30 + nameLength + extra;
        found[name] = new TextDecoder().decode(bytes.subarray(start, start + size)); at = start + size;
    }
    assert.equal(view.getUint32(at, true), 0x02014b50);
    assert.equal(view.getUint32(bytes.length - 22, true), 0x06054b50);
    assert.equal(view.getUint16(bytes.length - 12, true), Object.keys(found).length);
    return found;
}
function value(book, ref) {
    const [, letter, row] = /^([A-F])(\d+)$/.exec(ref);
    return book.rows[Number(row) - 1].cells[letter.charCodeAt(0) - 65];
}
test('Excel report reconciles income, result, cash and balances with numeric cells and formula totals', () => {
    const book = reportWorkbook(report, settings.name, '2026-10', 0);
    for (const [key, expected] of [['income', 10000], ['expenses', 0], ['result', 10000], ['cash', 0], ['customers', 10000], ['partners', 0], ['available', 0]]) {
        const output = value(book, book.refs[key]);
        assert.equal(output.value, expected);
        assert.equal(typeof output.value, 'number');
        assert.ok(output.formula);
    }
    const row = book.rows.find(row => row.cells[1]?.value === trip.name);
    assert.equal(row.cells[3].value, 10000);
    assert.equal(typeof row.cells[0].value, 'number');
    assert.equal(row.cells[0].style, 6);
});
test('XLSX package stores customer text as escaped literal strings, omits IDs and includes workbook styles', () => {
    const archive = files(reportXlsx(report, 'Test & Holidays', '2026-10', 0));
    const sheet = archive['xl/worksheets/sheet1.xml'];
    assert.ok(archive['[Content_Types].xml']); assert.ok(archive['xl/styles.xml']);
    assert.match(sheet, /t="inlineStr"><is><t xml:space="preserve">=HYPERLINK/);
    assert.match(sheet, /&lt;Private&gt; &amp; notes/);
    assert.doesNotMatch(sheet, /private-trip-id|<f>HYPERLINK|<hyperlink|externalLink/);
    assert.match(sheet, /showGridLines="0"/);
    assert.match(sheet, /state="frozen"/);
    assert.match(archive['xl/styles.xml'], /₹/);
});
test('EMIs and partner funding affect the correct Excel totals and incomplete interest stays visible', () => {
    const records = [vehicle, trip,
        { id: 'loan', kind: 'loan', vehicleId: 'v', name: 'Loan', start: '2026-10-01', firstDue: '2026-10-10', emi: 200000, total: 12, openingPaid: 0 },
        { id: 'emi', kind: 'expense', category: 'emi', loanId: 'loan', installment: 0, description: 'EMI', amount: 200000, date: '2026-10-10', paid: true },
        { id: 'partner', kind: 'partner', name: 'Partner', openingAmount: 0 },
        { id: 'funding', kind: 'partnerTx', partnerId: 'partner', type: 'contribution', date: '2026-10-09', amount: 300000 },
    ];
    const book = reportWorkbook(monthlyReport(records, settings, '2026-10'), settings.name, '2026-10', 0);
    assert.equal(value(book, book.refs.result).value, 8000);
    assert.equal(value(book, book.refs.cash).value, 1000);
    assert.equal(value(book, book.refs.partners).value, 3000);
    assert.ok(book.rows.some(row => row.cells.some(cell => cell.value === 'EMI split needed')));
    assert.doesNotThrow(() => reportXlsx(monthlyReport([], settings, '2026-10'), settings.name, '2026-10', 0, true));
});
test('long multiline notes are preserved in readable continuation rows without changing totals', () => {
    const notes = ('Line of notes\n'.repeat(150)).slice(0, 2000);
    const report = monthlyReport([vehicle, { ...trip, notes }], settings, '2026-10');
    const book = reportWorkbook(report, settings.name, '2026-10', 0);
    const firstSection = book.rows.slice(0, Number(book.refs.income.slice(1)) - 1);
    const continued = firstSection.filter(row => row.cells[0]?.value === 'Notes' || row.cells[0]?.value === 'Notes (cont.)');
    assert.equal(continued.map(row => row.cells[1].value).join(''), notes);
    assert.ok(continued.every(row => row.height <= 409));
    assert.equal(value(book, book.refs.income).value, 10000);
});
