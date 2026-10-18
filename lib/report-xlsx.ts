import { monthEnd } from './ledger';
import type { monthlyReport, ReportRow } from './report';

type Cell = { value?: string | number; formula?: string; style?: number };
type Row = { cells: Cell[]; height: number };
type Report = ReturnType<typeof monthlyReport>;
const cell = (value: string | number, style = 4): Cell => ({ value, style });
const money = (paise: number, formula?: string, style = 5): Cell => ({ value: paise / 100, formula, style });
const date = (value: string): Cell => cell((Date.parse(`${value}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000, 6);
const xml = (value: unknown) => String(value ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));

export function reportWorkbook(report: Report, name: string, month: string, reserve: number, sample = false) {
    const rows: Row[] = [], merges: string[] = [], refs: Record<string, string> = {};
    const m = report.summary;
    const add = (values: (Cell | string | number)[] = [], height = 24) => {
        rows.push({ cells: values.map(value => typeof value === 'object' ? value : cell(value)), height });
        return rows.length;
    };
    const merge = (row: number, from = 'A', to = 'F') => merges.push(`${from}${row}:${to}${row}`);
    const blank = () => add([], 12);
    const band = (title: string) => { const row = add([title, '', '', '', '', ''].map(value => cell(value, 2)), 28); merge(row); };
    const note = (text: string) => { const row = add([cell(text, 10)], 30); merge(row); };
    const label = (text: string, value: Cell, emphasis = false) => {
        const row = add([cell(text, emphasis ? 8 : 12), ...Array.from({ length: 4 }, () => cell('', emphasis ? 8 : 4)), { ...value, style: emphasis ? 7 : value.style }], 25);
        merge(row, 'A', 'E'); return row;
    };
    const header = (labels: string[]) => add(labels.map(value => cell(value, 3)), 32);
    const noteText = (row: ReportRow) => String(row.entry.notes || '');
    const expandedNotes = (row: ReportRow) => noteText(row).length > 250 || noteText(row).includes('\n');
    const rowNotes = (row: ReportRow) => expandedNotes(row) ? 'See notes below' : noteText(row);
    const appendNotes = (row: ReportRow) => {
        if (!expandedNotes(row)) return;
        const chunks: string[] = [];
        let chunk = '', lines = 0;
        for (const character of noteText(row)) {
            if (chunk.length >= 700 || lines >= 15) { chunks.push(chunk); chunk = ''; lines = 0; }
            chunk += character; if (character === '\n') lines++;
        }
        if (chunk) chunks.push(chunk);
        for (const [i, text] of chunks.entries()) {
            const height = Math.min(409, Math.max(34, (Math.ceil(text.length / 120) + text.split('\n').length) * 15 + 10));
            const index = add([cell(i ? 'Notes (cont.)' : 'Notes', 10), cell(text, 10), '', '', '', ''], height);
            merge(index, 'B', 'F');
        }
    };
    const sum = (column: string, start: number, end: number) => `SUM(${column}${start}:${column}${end})`;
    const period = new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    blank(); merge(add([cell(name, 1)], 29)); merge(add([cell(`Monthly report - ${period}${sample ? ' (SAMPLE)' : ''}`, 12)], 24));
    add([cell('Amounts in INR', 10), '', '', '', cell('Month end', 10), date(monthEnd(month))], 22);
    blank();
    const headlines = add([cell('Trip income', 11), cell('', 11), cell('Total expenses', 11), cell('', 11), cell(m.result < 0 ? 'Monthly shortfall' : 'Monthly surplus', 11), cell('', 11)], 24);
    for (const [from, to] of [['A', 'B'], ['C', 'D'], ['E', 'F']]) merge(headlines, from, to);
    const headlineValues = add([], 35);
    for (const [from, to] of [['A', 'B'], ['C', 'D'], ['E', 'F']]) merge(headlineValues, from, to);
    blank(); band('Income & expenses');
    note('Agreed income and trip costs follow the trip completion month. Full scheduled EMIs are deducted in their due month; cash uses actual payment dates.');
    header(['Date', 'Description', 'Details', 'Income (INR)', 'Expense (INR)', 'Notes']);
    const statement = [
        ...report.income.map(row => ({ ...row, income: true, category: 'Trip income' })),
        ...report.tripCosts.map(row => ({ ...row, income: false, category: 'Trip expense' })),
        ...report.businessCosts.map(row => ({ ...row, income: false, category: 'Business expense' })),
        ...report.emis.map(row => ({ ...row, income: false, category: 'Loan EMI' })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    const first = rows.length + 1;
    for (const row of statement) {
        add([date(row.date), row.title.trim(), `${row.category} · ${row.detail}`, row.income ? money(row.amount) : cell(''), row.income ? cell('') : money(row.amount), rowNotes(row)], Math.min(160, Math.max(34, 15 * Math.ceil(Math.max(row.title.length / 27, (row.detail.length + row.category.length + 3) / 33, rowNotes(row).length / 35)))));
        appendNotes(row);
    }
    if (!statement.length) note('No income or expenses recorded this month.');
    const last = rows.length;
    const totals = add([cell('Total income / expenses', 8), cell('', 8), cell('', 8), money(m.income, sum('D', first, last), 7), money(m.expenses, sum('E', first, last), 7), cell('', 8)], 26);
    merge(totals, 'A', 'C');
    const result = label('Monthly surplus / shortfall after EMI', money(m.result, `D${totals}-E${totals}`), true);
    refs.income = `D${totals}`; refs.expenses = `E${totals}`; refs.result = `F${result}`;
    rows[headlineValues - 1].cells = [money(m.income, refs.income, 9), cell('', 9), money(m.expenses, refs.expenses, 9), cell('', 9), money(m.result, refs.result, 9), cell('', 9)];
    for (const [title, category, amount] of [['Trip expenses', 'Trip expense', m.tripExpense], ['Additional business expenses', 'Business expense', m.businessExpense], ['Scheduled EMI for month', 'Loan EMI', m.emi]] as [string, string, number][])
        label(title, money(amount, `SUMIFS(E${first}:E${last},C${first}:C${last},"${category}*")`));

    blank(); band('Actual cash receipts & payments');
    note('Only actual payments affect cash. Partner contributions, repayments and distributions are separate from monthly income and expenses.');
    header(['Payment date', 'Transaction', 'Details', 'Money in (INR)', 'Money out (INR)', 'Notes']);
    const cashStart = rows.length + 1;
    for (const row of report.cash) {
        add([date(row.date), row.title, row.detail, row.amount >= 0 ? money(row.amount) : cell(''), row.amount < 0 ? money(-row.amount) : cell(''), rowNotes(row)], Math.min(160, Math.max(34, 15 * Math.ceil(Math.max(row.detail.length / 33, rowNotes(row).length / 35)))));
        appendNotes(row);
    }
    if (!report.cash.length) note('No cash receipts or payments recorded this month.');
    const cashEnd = rows.length;
    const opening = label('Opening cash / balance brought forward', money(report.openingCash));
    const cashIn = label('Money in', money(report.cashIn, sum('D', cashStart, cashEnd)));
    const cashOut = label('Money out', money(report.cashOut, sum('E', cashStart, cashEnd)));
    const closing = label('Cash at month end', money(m.cash, `F${opening}+F${cashIn}-F${cashOut}`), true);
    const commitmentLine = label('Unpaid commitments through month end', money(m.committed));
    const afterCommitments = label('Cash after commitments', money(m.afterCommitments, `F${closing}-F${commitmentLine}`));
    const reserveLine = label('Protected business reserve', money(reserve));
    const available = label('Cash available after commitments and reserve', money(m.available, `F${afterCommitments}-F${reserveLine}`), true);
    refs.cash = `F${closing}`; refs.available = `F${available}`;

    const balances = (title: string, items: ReportRow[], amount: number, partner = false) => {
        blank(); band(title);
        if (partner) header(['Partner', '', '', 'Outstanding (INR)', 'Notes', '']);
        else header(['Date', 'Description', 'Details', 'Outstanding (INR)', 'Notes', '']);
        if (partner) merge(rows.length, 'A', 'C');
        merge(rows.length, 'E', 'F');
        const start = rows.length + 1;
        for (const row of items) {
            const index = add(partner ? [row.title.trim(), '', '', money(row.amount), rowNotes(row), ''] : [date(row.date), row.title.trim(), row.detail, money(row.amount), rowNotes(row), ''], Math.min(160, Math.max(34, 15 * Math.ceil(Math.max(row.title.length / 27, row.detail.length / 33, rowNotes(row).length / 60)))));
            if (partner) merge(index, 'A', 'C');
            merge(index, 'E', 'F');
            appendNotes(row);
        }
        if (!items.length) note('No outstanding balances.');
        const total = add([cell('Total', 8), cell('', 8), cell('', 8), money(amount, sum('D', start, rows.length), 7), cell('', 8), cell('', 8)], 26);
        merge(total, 'A', 'C'); merge(total, 'E', 'F'); return `D${total}`;
    };
    refs.customers = balances('Customers owe at month end', report.customers, m.outstanding);
    refs.partners = balances('Business owes partners at month end', report.partners, m.partners, true);
    if (report.unpaid.length) {
        refs.commitments = balances('Unpaid commitments through month end', report.unpaid, m.committed);
        rows[commitmentLine - 1].cells[5] = money(m.committed, refs.commitments);
    } else refs.commitments = `F${commitmentLine}`;
    if (report.emis.length) {
        blank(); band('Loan interest breakdown');
        label('Operating profit before EMI', money(m.operating, `${refs.income}-F${result + 1}-F${result + 2}`));
        label('Loan interest', m.interestIncomplete ? cell('EMI split needed') : money(m.interest));
        label('Profit after loan interest', m.interestIncomplete ? cell('EMI split needed') : money(m.profit, `F${rows.length - 1}-F${rows.length}`));
    }
    blank(); note('Source: monthly ledger records. Changes made in this workbook do not update the application.');
    return { rows, merges, refs, widths: [14, 29, 37, 18, 18, 38] };
}

const namespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const font = (size: number, color = '203C30', bold = false, italic = false) => `<font><sz val="${size}"/><color rgb="FF${color}"/><name val="Arial"/>${bold ? '<b/>' : ''}${italic ? '<i/>' : ''}</font>`;
const format = (fontId = 0, fillId = 0, borderId = 0, numFmtId = 0, align = 'left', wrap = true) => `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="${align}" vertical="center" wrapText="${wrap ? 1 : 0}"/></xf>`;
const styles = declaration + `<styleSheet xmlns="${namespace}"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd mmm yyyy"/><numFmt numFmtId="165" formatCode="${xml('"₹"#,##0.00;[Red]("₹"#,##0.00);"₹"0.00')}"/></numFmts><fonts count="5">${font(11)}${font(11, '203C30', true)}${font(16, '174B36', true)}${font(11, 'FFFFFF', true)}${font(10, '63796F', false, true)}</fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF174B36"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF5F0"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFDCE8DF"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="13">${format()}${format(2)}${format(3, 2)}${format(1, 3, 1, 0, 'center')}${format(0, 0, 1)}${format(0, 0, 1, 165, 'right', false)}${format(0, 0, 1, 164, 'left', false)}${format(1, 3, 1, 165, 'right', false)}${format(1, 3, 1)}${format(2, 3, 0, 165, 'right', false)}${format(4)}${format(1, 3)}${format(1)}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

// A workbook is an OOXML package. Stored ZIP entries keep this browser export small and dependency-free.
function zip(files: Record<string, string>) {
    const encoder = new TextEncoder(), local: Uint8Array[] = [], directory: Uint8Array[] = [];
    let offset = 0;
    const crcTable = Uint32Array.from({ length: 256 }, (_, n) => { for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
    for (const [path, text] of Object.entries(files)) {
        const name = encoder.encode(path), content = encoder.encode(text);
        let crc = 0xffffffff;
        for (const byte of content) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
        crc = (crc ^ 0xffffffff) >>> 0;
        const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer);
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(12, 33, true);
        h.setUint32(14, crc, true); h.setUint32(18, content.length, true); h.setUint32(22, content.length, true); h.setUint16(26, name.length, true); header.set(name, 30);
        const central = new Uint8Array(46 + name.length), c = new DataView(central.buffer);
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 33, true);
        c.setUint32(16, crc, true); c.setUint32(20, content.length, true); c.setUint32(24, content.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true); central.set(name, 46);
        local.push(header, content); directory.push(central); offset += header.length + content.length;
    }
    const directorySize = directory.reduce((sum, entry) => sum + entry.length, 0), end = new Uint8Array(22), e = new DataView(end.buffer), count = directory.length;
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, count, true); e.setUint16(10, count, true); e.setUint32(12, directorySize, true); e.setUint32(16, offset, true);
    const bytes = new Uint8Array(offset + directorySize + end.length);
    let at = 0; for (const part of [...local, ...directory, end]) { bytes.set(part, at); at += part.length; }
    return bytes;
}

export function reportXlsx(report: Report, name: string, month: string, reserve: number, sample = false) {
    const book = reportWorkbook(report, name, month, reserve, sample), last = book.rows.length;
    const data = book.rows.map((row, i) => `<row r="${i + 1}" ht="${row.height}" customHeight="1">${row.cells.map((item, column) => {
        const address = `${String.fromCharCode(65 + column)}${i + 1}`, attributes = `r="${address}" s="${item.style || 0}"`;
        if (item.formula || typeof item.value === 'number') {
            if (typeof item.value !== 'number' || !Number.isFinite(item.value)) throw new Error('Report contains an invalid numeric amount.');
            return `<c ${attributes}>${item.formula ? `<f>${xml(item.formula)}</f>` : ''}<v>${item.value}</v></c>`;
        }
        return `<c ${attributes} t="inlineStr"><is><t xml:space="preserve">${xml(item.value)}</t></is></c>`;
    }).join('')}</row>`).join('');
    const rels = 'http://schemas.openxmlformats.org/package/2006/relationships', docRels = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    return zip({
        '[Content_Types].xml': declaration + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels': declaration + `<Relationships xmlns="${rels}"><Relationship Id="rId1" Type="${docRels}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        'xl/workbook.xml': declaration + `<workbook xmlns="${namespace}" xmlns:r="${docRels}"><bookViews><workbookView/></bookViews><sheets><sheet name="Monthly report" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'Monthly report'!$A$1:$F$${last}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">'Monthly report'!$1:$4</definedName></definedNames><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`,
        'xl/_rels/workbook.xml.rels': declaration + `<Relationships xmlns="${rels}"><Relationship Id="rId1" Type="${docRels}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${docRels}/styles" Target="styles.xml"/></Relationships>`,
        'xl/styles.xml': styles,
        'xl/worksheets/sheet1.xml': declaration + `<worksheet xmlns="${namespace}"><sheetPr><tabColor rgb="FF174B36"/><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:F${last}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A5" sqref="A5"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="24"/><cols>${book.widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${data}</sheetData><mergeCells count="${book.merges.length}">${book.merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L${xml(name.replaceAll('&', '&&'))}&amp;RPage &amp;P of &amp;N</oddFooter></headerFooter></worksheet>`,
    });
}
