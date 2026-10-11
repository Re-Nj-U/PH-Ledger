import { pgSchema, text, integer } from 'drizzle-orm/pg-core';
const ledger = pgSchema('ledger');
export const business = ledger.table('business', { id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), settings: text('settings').notNull(), revision: integer('revision').notNull().default(1) });
export const members = ledger.table('members', { email: text('email').primaryKey(), name: text('name').notNull(), role: text('role').notNull(), active: integer('active').notNull().default(1) });
export const records = ledger.table('records', { id: text('id').primaryKey(), kind: text('kind').notNull(), data: text('data').notNull(), version: integer('version').notNull().default(1), updatedAt: text('updated_at').notNull() });
export const audit = ledger.table('audit', { id: text('id').primaryKey().notNull(), recordId: text('record_id').notNull(), action: text('action').notNull(), actor: text('actor').notNull(), at: text('at').notNull(), before: text('before'), after: text('after') });
