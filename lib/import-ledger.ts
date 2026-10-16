import type { LedgerDatabase } from './database';
import { validateBackup } from './import-backup';

export async function importLedger(db: LedgerDatabase, value: unknown, revision: number, actor: string) {
    const backup = validateBackup(value);
    const [{ count }] = (await db.prepare('SELECT COUNT(*)::integer AS count FROM records').all<{ count: number }>()).results;
    if (count !== 0) throw new Error('409:Import is only available for an empty ledger. Existing records will not be replaced.');
    const at = new Date().toISOString();
    const statements = [db.prepare('UPDATE business SET settings=? WHERE id=?').bind(JSON.stringify(backup.settings), 'main')];
    for (const record of backup.records) {
        const { version: _version, ...data } = record;
        statements.push(db.prepare('INSERT INTO records(id,kind,data,version,updated_at) VALUES(?,?,?,1,?)').bind(record.id, record.kind, JSON.stringify(data), at));
    }
    statements.push(db.prepare('INSERT INTO audit(id,record_id,action,actor,at,after) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(), 'ledger', 'backup imported', actor, at, JSON.stringify({ exportedAt: backup.exportedAt, count: backup.records.length })));
    // The business-row lock/revision check prevents concurrent entries during import.
    await db.batch(statements, revision);
    return backup.records.length;
}
