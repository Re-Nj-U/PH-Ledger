// The ledger uses parameterized statements through a small Postgres repository.
// This layer has no HTTP/auth dependencies so transaction behavior can be tested.
export type Query = (text: string, values?: unknown[]) => Promise<any[]>;
export type Backend = {
    query: Query;
    transaction: <T>(work: (query: Query) => Promise<T>) => Promise<T>;
};

export class Statement {
    constructor(readonly database: LedgerDatabase, readonly text: string, readonly values: unknown[] = []) {}
    bind(...values: unknown[]) { return new Statement(this.database, this.text, values); }
    async first<T = any>(): Promise<T | null> { return (await this.database.backend.query(this.text, this.values))[0] ?? null; }
    async all<T = any>(): Promise<{ results: T[] }> { return { results: await this.database.backend.query(this.text, this.values) }; }
    async run() { await this.database.backend.query(this.text, this.values); }
}

export class LedgerDatabase {
    constructor(readonly backend: Backend) {}
    prepare(text: string) {
        // All SQL is a developer-defined literal; user values only reach bind().
        let parameter = 0;
        const qualified = text.replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(business|members|records|audit)\b/gi, '$1 ledger.$2');
        return new Statement(this, qualified.replace(/\?/g, () => `$${++parameter}`));
    }
    async batch(statements: Statement[], expectedRevision: number) {
        await this.backend.transaction(async query => {
            const [business] = await query('SELECT revision FROM ledger.business WHERE id=$1 FOR UPDATE', ['main']);
            if (!business || business.revision !== expectedRevision)
                throw new Error('409:The ledger changed on another device. Refresh and try again.');
            for (const statement of statements) await query(statement.text, statement.values);
            await query('UPDATE ledger.business SET revision=revision+1 WHERE id=$1', ['main']);
        });
    }
}
