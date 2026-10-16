-- Run once in a NEW Supabase project's SQL Editor. Never run legacy SQLite migrations.
-- Ledger tables use a private schema; only the server connects to them.
BEGIN;
CREATE SCHEMA IF NOT EXISTS ledger;
REVOKE ALL ON SCHEMA ledger FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS ledger.business (
    id text PRIMARY KEY CHECK (id = 'main'),
    owner_id text NOT NULL,
    settings text NOT NULL,
    revision integer NOT NULL DEFAULT 1 CHECK (revision > 0)
);
CREATE TABLE IF NOT EXISTS ledger.members (
    email text PRIMARY KEY,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('owner','partner')),
    active integer NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);
CREATE TABLE IF NOT EXISTS ledger.records (
    id text PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN ('trip','payment','expense','partner','partnerTx','loan','vehicle','due')),
    data text NOT NULL,
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS ledger.audit (
    id text PRIMARY KEY NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL,
    actor text NOT NULL,
    at text NOT NULL,
    before text,
    after text
);
CREATE INDEX IF NOT EXISTS ledger_records_kind ON ledger.records(kind);
CREATE INDEX IF NOT EXISTS ledger_audit_at ON ledger.audit(at DESC);
-- Defense in depth: no browser-facing database access or RLS policies.
ALTER TABLE ledger.business ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger.audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA ledger FROM PUBLIC, anon, authenticated;
COMMIT;
