export function csv(rows: unknown[][]) {
    return rows.map(row => row.map(value => {
        let text = String(value ?? '');
        // Spreadsheet apps can ignore leading whitespace before formulas.
        if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }).join(',')).join('\r\n');
}
