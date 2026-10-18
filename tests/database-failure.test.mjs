import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { databaseFailure } from '../lib/database-failure.mjs';

test('database failures distinguish configuration, TLS, credentials, schema, permissions and connectivity', () => {
    for (const [code, expected] of [
        ['ERR_INVALID_URL', 'DB_CONFIGURATION'], ['3D000', 'DB_CONFIGURATION'],
        ['SELF_SIGNED_CERT_IN_CHAIN', 'DB_TLS'], ['ERR_TLS_CERT_ALTNAME_INVALID', 'DB_TLS'],
        ['28P01', 'DB_LOGIN'], ['28000', 'DB_LOGIN'],
        ['42P01', 'DB_SCHEMA'], ['3F000', 'DB_SCHEMA'], ['42703', 'DB_SCHEMA'],
        ['42501', 'DB_PERMISSION'], ['CONNECT_TIMEOUT', 'DB_CONNECTION'], ['ENOTFOUND', 'DB_CONNECTION'],
    ]) {
        const result = databaseFailure({ code });
        assert.equal(result.code, expected);
        assert.equal(result.log.driverCode, code);
        assert.ok(result.message.includes(`[${expected}: ${code}]`));
    }
});
test('public errors and server diagnostics never copy messages, SQL, credentials or arbitrary driver codes', () => {
    const secret = 'postgresql://private-user:private-password@private-host/database';
    for (const code of ['28P01', secret, undefined]) {
        const result = databaseFailure({ code, message: secret, query: secret, parameters: [secret], detail: secret, severity: secret });
        assert.equal(JSON.stringify(result).includes(secret), false);
        assert.deepEqual(Object.keys(result.log).sort(), ['category', 'driverCode', 'event']);
        if (code !== '28P01') assert.equal(result.code, 'DB_OPERATION');
    }
});
test('wrapped errors are classified without following circular or unbounded causes', () => {
    assert.equal(databaseFailure(new Error('private', { cause: { code: 'SELF_SIGNED_CERT_IN_CHAIN' } })).code, 'DB_TLS');
    const circular = {}; circular.cause = circular;
    assert.equal(databaseFailure(circular).code, 'DB_OPERATION');
    for (const value of [null, undefined, 'private text', 42]) assert.equal(databaseFailure(value).code, 'DB_OPERATION');
});
