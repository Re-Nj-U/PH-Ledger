import { test, before, after, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { LedgerDatabase } from '../lib/database.ts';
import { resolveAccess } from '../lib/access.ts';
import { changeBusinessOwner, transferOwnership, confirmOwnerPassword } from '../lib/ownership.ts';

let pg, db;
const owner={userId:'old-id',email:'old@example.com',displayName:'Previous owner'};
const target={userId:'new-id',email:'new@example.com',displayName:'New owner'};
const payload={email:target.email,confirmEmail:target.email,confirmed:true,password:'test-only-password'};
const context=()=>({db,user:owner,owner:true,revision:1});
const verify=async(user,password)=>{assert.equal(user.userId,owner.userId);assert.equal(password,payload.password);};
before(async()=>{
 pg=await PGlite.create();await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 await pg.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
 await pg.exec('CREATE SCHEMA auth; CREATE TABLE auth.users(id text PRIMARY KEY,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,deleted_at timestamptz,banned_until timestamptz);');
 db=new LedgerDatabase({query:async(text,values=[])=> (await pg.query(text,values)).rows,transaction:work=>pg.transaction(tx=>work(async(text,values=[])=> (await tx.query(text,values)).rows))});
});
after(async()=>{await pg.close();});
beforeEach(async()=>{
 await pg.exec('TRUNCATE ledger.audit,ledger.records,ledger.members,ledger.business,auth.users;');
 await db.prepare('INSERT INTO business(id,owner_id,settings) VALUES(?,?,?)').bind('main',owner.userId,JSON.stringify({name:'PIKU',startDate:'2026-10-01',openingCash:0,reserve:0})).run();
 for(const [u,role] of [[owner,'owner'],[target,'partner']]){
  await db.prepare('INSERT INTO members(email,name,role,active) VALUES(?,?,?,1)').bind(u.email,u.displayName,role).run();
  await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,last_sign_in_at) VALUES($1,$2,now(),now())',[u.userId,u.email]);
 }
 await db.prepare('INSERT INTO records(id,kind,data,updated_at) VALUES(?,?,?,?)').bind('trip','trip','{"unchanged":true}','now').run();
});
const business=()=>db.prepare('SELECT owner_id,revision,settings FROM business').first();
const assertUnchanged=async()=>{assert.equal((await business()).owner_id,owner.userId);assert.equal((await business()).revision,1);assert.equal((await db.prepare('SELECT COUNT(*)::int AS count FROM audit').first()).count,0);};

test('transfer changes the pinned identity and both roles atomically, keeps the old login as partner and preserves records',async()=>{
 const settings=(await business()).settings;
 await changeBusinessOwner(context(),{...payload,email:' NEW@EXAMPLE.COM ',confirmEmail:'new@example.com'},verify);
 assert.equal((await business()).owner_id,target.userId);assert.equal((await business()).revision,2);assert.equal((await business()).settings,settings);
 assert.deepEqual((await db.prepare('SELECT email,role,active FROM members ORDER BY email').all()).results,[{email:target.email,role:'owner',active:1},{email:owner.email,role:'partner',active:1}]);
 assert.equal((await resolveAccess(db,target,'old@example.com')).owner,true);
 assert.equal((await resolveAccess(db,owner,'old@example.com')).owner,false);
 assert.equal((await db.prepare('SELECT data FROM records WHERE id=?').bind('trip').first()).data,'{"unchanged":true}');
 const audit=await db.prepare('SELECT action,actor,before,after FROM audit').first();assert.equal(audit.action,'ownership transferred');assert.equal(audit.actor,owner.email);assert.equal(JSON.parse(audit.after).previousOwnerRole,'partner');assert.equal(JSON.stringify(audit).includes(payload.password),false);
 await assert.rejects(changeBusinessOwner({...context(),revision:2},payload,verify),/403/);
 await assert.rejects(db.batch([db.prepare('UPDATE business SET settings=? WHERE id=?').bind('{}','main')],1),/409/);
});
test('partners, self-transfer and missing or mismatched confirmation fail before password verification',async()=>{
 let calls=0;const shouldNotVerify=async()=>{calls++;};
 await assert.rejects(changeBusinessOwner({...context(),owner:false},payload,shouldNotVerify),/403/);
 for(const transfer of [{...payload,confirmed:false},{...payload,confirmEmail:'different@example.com'},{...payload,password:''},{...payload,userId:'injected'},{...payload,email:owner.email,confirmEmail:owner.email}]) await assert.rejects(changeBusinessOwner(context(),transfer,shouldNotVerify),/400/);
 assert.equal(calls,0);await assertUnchanged();
});
test('a failed current-password check cannot transfer ownership',async()=>{
 await assert.rejects(changeBusinessOwner(context(),payload,async()=>{throw new Error('403:Check your current password.');}),/403/);await assertUnchanged();
});
test('missing, inactive and non-partner memberships cannot receive ownership',async()=>{
 for(const sql of ["DELETE FROM ledger.members WHERE email='new@example.com'","INSERT INTO ledger.members(email,name,role,active) VALUES('new@example.com','New','partner',0)","UPDATE ledger.members SET role='owner',active=1 WHERE email='new@example.com'"]){
  await pg.exec(sql);await assert.rejects(changeBusinessOwner(context(),payload,verify),/active partner/);await assertUnchanged();
 }
});
test('missing, unconfirmed, never signed-in, deleted, banned or ambiguous Auth accounts cannot receive ownership',async()=>{
 for(const patch of ["email_confirmed_at=NULL","last_sign_in_at=NULL","deleted_at=now()","banned_until=now()+interval '1 day'"]){
  await pg.exec(`UPDATE auth.users SET ${patch} WHERE id='new-id'`);await assert.rejects(changeBusinessOwner(context(),payload,verify),/sign in successfully/);await assertUnchanged();
  await pg.exec("UPDATE auth.users SET email_confirmed_at=now(),last_sign_in_at=now(),deleted_at=NULL,banned_until=NULL WHERE id='new-id'");
 }
 await pg.exec("INSERT INTO auth.users(id,email,email_confirmed_at,last_sign_in_at) VALUES('duplicate','NEW@example.com',now(),now())");
 await assert.rejects(changeBusinessOwner(context(),payload,verify),/sign in successfully/);await pg.exec("DELETE FROM auth.users WHERE id='duplicate'");
 await pg.exec("DELETE FROM auth.users WHERE id='new-id'");await assert.rejects(changeBusinessOwner(context(),payload,verify),/sign in successfully/);await assertUnchanged();
});
test('a stale owner context and concurrent ledger edits cannot transfer ownership',async()=>{
 await assert.rejects(transferOwnership(db,{...owner,userId:'not-owner'},target.email,1),/403/);
 await pg.exec('UPDATE ledger.business SET revision=2');await assert.rejects(changeBusinessOwner(context(),payload,verify),/409/);assert.equal((await business()).owner_id,owner.userId);
});
test('failure while writing the audit rolls back both roles, owner identity and revision',async()=>{
 const failing=new LedgerDatabase({...db.backend,transaction:work=>db.backend.transaction(query=>work(async(text,values)=>{if(text.startsWith('INSERT INTO ledger.audit'))throw new Error('forced audit failure');return query(text,values);} ))});
 await assert.rejects(changeBusinessOwner({...context(),db:failing},payload,verify),/forced audit failure/);await assertUnchanged();
 assert.equal((await db.prepare('SELECT role FROM members WHERE email=?').bind(owner.email).first()).role,'owner');assert.equal((await db.prepare('SELECT role FROM members WHERE email=?').bind(target.email).first()).role,'partner');
});
test('fresh password verification pins the user ID and revokes only its isolated session, including on failure',async()=>{
 for(const response of [{data:{user:{id:owner.userId,email_confirmed_at:'now'}},error:null},{data:{user:{id:'attacker',email_confirmed_at:'now'}},error:null},{data:{user:{id:owner.userId,email_confirmed_at:null}},error:null},{data:{user:null},error:{message:'do not reflect'}}]){
  let loggedOut;const client={auth:{signInWithPassword:async credentials=>{assert.equal(credentials.email,owner.email);return response;},signOut:async options=>{loggedOut=options;}}};
  if(response.data.user?.id===owner.userId&&response.data.user.email_confirmed_at)await confirmOwnerPassword(client,owner,payload.password);else await assert.rejects(confirmOwnerPassword(client,owner,payload.password),/403:Check your current password and try again/);
  assert.deepEqual(loggedOut,{scope:'local'});
 }
});

test('a subsequent explicit transfer back remains possible, with one owner and no changes to financial records',async()=>{
 await changeBusinessOwner(context(),payload,verify);
 await changeBusinessOwner({db,user:target,owner:true,revision:2},{...payload,email:owner.email,confirmEmail:owner.email},async user=>{assert.equal(user.userId,target.userId);});
 assert.equal((await business()).owner_id,owner.userId);assert.equal((await business()).revision,3);
 assert.equal((await db.prepare("SELECT COUNT(*)::int AS count FROM members WHERE role='owner'").first()).count,1);
 assert.equal((await resolveAccess(db,owner,'old@example.com')).owner,true);assert.equal((await resolveAccess(db,target,'old@example.com')).owner,false);
 assert.equal((await db.prepare('SELECT COUNT(*)::int AS count FROM audit').first()).count,2);
});
