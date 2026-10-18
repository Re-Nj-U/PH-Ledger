// Only fixed classifications/codes are returned or logged. Driver messages may contain secrets.
const groups = [
    ['DB_TLS', 'The database security certificate could not be verified. Ask the owner to check the database certificate configuration.',
        ['SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'CERT_UNTRUSTED', 'ERR_TLS_CERT_ALTNAME_INVALID', 'ERR_SSL_CERTIFICATE_VERIFY_FAILED']],
    ['DB_LOGIN', 'The database rejected the connection credentials. Ask the owner to check the database username and password.',
        ['28P01', '28000', 'SASL_SIGNATURE_MISMATCH']],
    ['DB_SCHEMA', 'The ledger database tables are missing or outdated. Ask the owner to check the database setup.',
        ['42P01', '3F000', '42703']],
    ['DB_PERMISSION', 'The database connection does not have permission to access the ledger. Ask the owner to check database access.',
        ['42501']],
    ['DB_CONNECTION', 'The application could not reach the database. Ask the owner to check the connection settings and database availability.',
        ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'CONNECT_TIMEOUT', 'CONNECTION_CLOSED', 'CONNECTION_ENDED', 'CONNECTION_DESTROYED', '08000', '08001', '08003', '08004', '08006', '08007', '08P01', '57P01', '57P02', '57P03', '53300']],
    ['DB_CONFIGURATION', 'The database connection setting is invalid. Ask the owner to check the database connection URL.',
        ['ERR_INVALID_URL', 'ERR_SOCKET_BAD_PORT', '3D000']],
];

export function databaseFailure(error) {
    const visited = new Set();
    let current = error;
    for (let depth = 0; current && typeof current === 'object' && depth < 5 && !visited.has(current); depth++) {
        visited.add(current);
        for (const [category, message, codes] of groups) {
            if (codes.includes(current.code)) return {
                message: `${message} [${category}: ${current.code}]`,
                code: category,
                log: { event: 'ledger_database_failure', category, driverCode: current.code },
            };
        }
        current = current.cause;
    }
    return {
        message: 'The database operation could not be completed. Ask the owner to check the database setup. [DB_OPERATION]',
        code: 'DB_OPERATION',
        log: { event: 'ledger_database_failure', category: 'DB_OPERATION', driverCode: 'UNCLASSIFIED' },
    };
}
