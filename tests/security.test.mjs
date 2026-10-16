import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { validateWriteRequest, readLedgerBody, MAX_LEDGER_BODY_BYTES } from '../lib/request-security.ts';
import { csv } from '../lib/csv.ts';
import { authCookieOptions } from '../lib/supabase/cookie-options.ts';

const url = 'https://ledger.example/api/ledger';
function request(headers = {}, body = '{"action":"save"}') {
    return new Request(url, { method: 'POST', headers: { origin: 'https://ledger.example', 'content-type': 'application/json', ...headers }, body });
}
test('ledger mutations reject cross-origin, missing/null origins and form submissions', () => {
    assert.doesNotThrow(() => validateWriteRequest(request()));
    for (const origin of ['https://attacker.example', 'null', 'https://ledger.example.attacker.example'])
        assert.throws(() => validateWriteRequest(request({ origin })), /403/);
    const absent = request(); absent.headers.delete('origin');
    assert.throws(() => validateWriteRequest(absent), /403/);
    assert.throws(() => validateWriteRequest(request({ 'sec-fetch-site': 'cross-site' })), /403/);
    for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data'])
        assert.throws(() => validateWriteRequest(request({ 'content-type': type })), /415/);
    assert.doesNotThrow(() => validateWriteRequest(request({ 'content-type': 'application/json; charset=utf-8' })));
    const proxied = new Request('http://localhost:3000/api/ledger', {
        method: 'POST', headers: { host: 'ledger.example', origin: 'https://ledger.example', 'content-type': 'application/json' }, body: '{}',
    });
    assert.doesNotThrow(() => validateWriteRequest(proxied));
    proxied.headers.set('origin', 'https://attacker.example');
    assert.throws(() => validateWriteRequest(proxied), /403/);
});
test('body reader rejects malformed JSON without reflecting its contents', async () => {
    assert.deepEqual(await readLedgerBody(request()), { action: 'save' });
    for (const text of ['{"private":"sensitive ledger text"', 'null', '[]', '"text"'])
        await assert.rejects(readLedgerBody(request({}, text)), /^Error: 400:Send a valid JSON object\.$/);
});
test('body size is bounded even for streams without Content-Length', async () => {
    await assert.rejects(readLedgerBody(request({ 'content-length': String(MAX_LEDGER_BODY_BYTES + 1) })), /413/);
    let cancelled = false;
    const stream = new ReadableStream({
        start(controller) { controller.enqueue(new Uint8Array(MAX_LEDGER_BODY_BYTES)); controller.enqueue(new Uint8Array(1)); },
        cancel() { cancelled = true; },
    });
    await assert.rejects(readLedgerBody(new Request(url, { method: 'POST', body: stream, duplex: 'half' })), /413/);
    assert.equal(cancelled, true);
});
test('CSV keeps user text inert, including formulas behind leading whitespace', () => {
    const output = csv([['=HYPERLINK("https://attacker.example")', '\t=1+1', '  +1+1', '\r@SUM(1)', 'normal "quoted" text', -100]]);
    assert.equal(output, '"\'=HYPERLINK(""https://attacker.example"")","\'\t=1+1","\'  +1+1","\'\r@SUM(1)","normal ""quoted"" text","\'-100"');
});
test('production Auth cookies are HTTPS-only, host-bound and hidden from browser JavaScript', () => {
    const options = authCookieOptions(true);
    assert.equal(options.name.startsWith('__Host-'), true);
    assert.equal(options.secure, true); assert.equal(options.httpOnly, true);
    assert.equal(options.path, '/'); assert.equal(options.domain, undefined);
    assert.equal(options.sameSite, 'lax');
});
