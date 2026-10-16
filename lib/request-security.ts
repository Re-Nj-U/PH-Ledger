export const MAX_LEDGER_BODY_BYTES = 3_200_000;

// The ledger API is called only by this application's browser UI.
export function validateWriteRequest(request: Request) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host') || new URL(request.url).host;
    let originUrl: URL | undefined;
    try { if (origin) originUrl = new URL(origin); } catch { /* Reject malformed Origin below. */ }
    // Next can use an internal hostname in request.url. Browser callers cannot
    // override Host; compare its authority, like Next's Server Action CSRF check.
    if (!originUrl || originUrl.origin !== origin || !['http:', 'https:'].includes(originUrl.protocol)
        || originUrl.host.toLowerCase() !== host.toLowerCase() || request.headers.get('sec-fetch-site') === 'cross-site')
        throw new Error('403:Request origin does not match.');
    const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (type !== 'application/json') throw new Error('415:Send ledger changes as JSON.');
}

export async function readLedgerBody(request: Request) {
    const length = request.headers.get('content-length');
    if (length && Number(length) > MAX_LEDGER_BODY_BYTES)
        throw new Error('413:Use a backup smaller than 3 MB.');
    if (!request.body) throw new Error('400:Send a valid JSON object.');
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > MAX_LEDGER_BODY_BYTES) {
                await reader.cancel();
                throw new Error('413:Use a backup smaller than 3 MB.');
            }
            chunks.push(value);
        }
    } finally { reader.releaseLock(); }
    try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
        return body;
    } catch { throw new Error('400:Send a valid JSON object.'); }
}
