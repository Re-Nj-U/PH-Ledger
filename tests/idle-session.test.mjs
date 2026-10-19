import test from 'node:test';
import assert from 'node:assert/strict';
import { signIdleCookie, readIdleCookie, matchesIdleIdentity, idleCookieOptions, sessionCookieNames } from '../lib/idle-cookie.ts';
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS, idleState } from '../lib/idle-policy.ts';
import { IdleTimer } from '../lib/idle-timer.ts';
import { NextRequest } from 'next/server.js';
import { proxy } from '../proxy.ts';
const now=Date.parse('2026-10-19T12:00:00Z'), env={DATABASE_URL:'postgresql://test:fictional-secret@localhost/idle-tests'};
const token=()=>signIdleCookie('user','session',now,env);

test('signed activity expires exactly at 30 minutes, independently of browser timers or token refresh',()=>{
 assert.equal(readIdleCookie(token(),now+IDLE_TIMEOUT_MS-1,env).at,now);
 assert.equal(readIdleCookie(token(),now+IDLE_TIMEOUT_MS,env),null);
 assert.equal(readIdleCookie(token(),now+24*60*60*1000,env),null);
 assert.equal(readIdleCookie(undefined,now,env),null);
});
test('tampering with timestamp, identity or signature cannot revive a session',()=>{
 const original=token();const [body,signature]=original.split('.');
 for(const patch of [{at:now+IDLE_TIMEOUT_MS},{userId:'another-user'},{sessionId:'another-session'}]){
  const changed=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(body,'base64url').toString()),...patch})).toString('base64url');
  assert.equal(readIdleCookie(changed+'.'+signature,now,env),null);
 }
 for(const malformed of ['bad',original+'.extra',original.slice(0,-1)+'!',original+'x','x'.repeat(1025)])assert.equal(readIdleCookie(malformed,now,env),null);
 assert.equal(readIdleCookie(original,now,{DATABASE_URL:'different-deployment-secret'}),null);
});
test('activity is bound to the verified account and Supabase session, not just a remembered browser',()=>{
 const identity=readIdleCookie(token(),now,env);
 assert.equal(matchesIdleIdentity(identity,'user','session'),true);
 assert.equal(matchesIdleIdentity(identity,'user','other-session'),false);
 assert.equal(matchesIdleIdentity(identity,'another-user','session'),false);
 assert.equal(matchesIdleIdentity(null,'user','session'),false);
 assert.equal(readIdleCookie(signIdleCookie('user','session',now+31_000,env),now,env),null);
});
test('production activity cookies are HTTP-only and HTTPS-only, host-bound and limited to 30 minutes',()=>{
 const cookie=idleCookieOptions(true);assert.equal(cookie.httpOnly,true);assert.equal(cookie.secure,true);assert.equal(cookie.path,'/');assert.equal(cookie.domain,undefined);assert.equal(cookie.sameSite,'lax');assert.equal(cookie.maxAge,1800);assert.ok(cookie.name.startsWith('__Host-'));
 assert.deepEqual(sessionCookieNames(['__Host-piku-auth','__Host-piku-auth.0','__Host-piku-auth.1','__Host-piku-idle','unrelated-cookie','__Host-piku-auth-attacker'],true),['__Host-piku-auth','__Host-piku-auth.0','__Host-piku-auth.1','__Host-piku-idle']);
});
test('a missing server signing secret cannot silently disable inactivity enforcement',()=>{
 assert.throws(()=>signIdleCookie('u','s',now,{}),/503/);
});
test('the warning starts one minute before expiry and the timer catches overnight sleep in one check',()=>{
 assert.equal(idleState(now+IDLE_TIMEOUT_MS,now+IDLE_TIMEOUT_MS-IDLE_WARNING_MS-1),'active');
 assert.equal(idleState(now+IDLE_TIMEOUT_MS,now+IDLE_TIMEOUT_MS-IDLE_WARNING_MS),'warning');
 const clock=new IdleTimer({expiresAt:now+IDLE_TIMEOUT_MS,serverNow:now},now);
 assert.equal(clock.state(now+IDLE_TIMEOUT_MS-1),'warning');assert.equal(clock.state(now+IDLE_TIMEOUT_MS),'expired');assert.equal(clock.state(now+12*60*60*1000),'expired');assert.equal(clock.remaining(now+12*60*60*1000),0);
});
test('background status checks and focus do not extend a deadline; a confirmed activity response does',()=>{
 const clock=new IdleTimer({expiresAt:now+IDLE_TIMEOUT_MS,serverNow:now},now);
 clock.update({expiresAt:now+IDLE_TIMEOUT_MS,serverNow:now+600_000},now+600_000);
 assert.equal(clock.expiresAt,now+IDLE_TIMEOUT_MS);assert.equal(clock.remaining(now+600_000),1_200_000);
 clock.update({expiresAt:now+600_000+IDLE_TIMEOUT_MS,serverNow:now+600_000},now+600_000);
 assert.equal(clock.remaining(now+600_000),IDLE_TIMEOUT_MS);
});
test('real activity is throttled, while warnings and expired sessions cannot trigger an automatic keep-alive',()=>{
 const clock=new IdleTimer({expiresAt:now+IDLE_TIMEOUT_MS,serverNow:now},now);
 assert.equal(clock.activityDue(now),true);assert.equal(clock.activityDue(now+1000),false);assert.equal(clock.activityDue(now+30_000),true);
 assert.equal(clock.activityDue(now+IDLE_TIMEOUT_MS-IDLE_WARNING_MS),false);assert.equal(clock.activityDue(now+IDLE_TIMEOUT_MS),false);
});
test('server time compensates for a different laptop clock and another tab can update the shared deadline',()=>{
 const clientNow=now+5*60*60*1000;
 const clock=new IdleTimer({expiresAt:now+IDLE_TIMEOUT_MS,serverNow:now},clientNow);
 assert.equal(clock.remaining(clientNow),IDLE_TIMEOUT_MS);assert.equal(clock.state(clientNow+IDLE_TIMEOUT_MS),'expired');
 clock.update({expiresAt:now+20*60*1000+IDLE_TIMEOUT_MS,serverNow:now+20*60*1000},clientNow+20*60*1000);
 assert.equal(clock.remaining(clientNow+20*60*1000),IDLE_TIMEOUT_MS);
});
test('the proxy denies missing activity on financial endpoints and redirects pages without exposing ledger data',async()=>{
 const idleName=idleCookieOptions().name, authName=idleName.replace('idle','auth');
 const request=new NextRequest('https://ledger.example/api/ledger',{headers:{cookie:`${authName}.0=old-session; ${idleName}=invalid; unrelated=keep`}});
 const response=await proxy(request);assert.equal(response.status,401);assert.equal((await response.json()).code,'SESSION_EXPIRED');assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.cookies.get(authName+'.0').maxAge,0);assert.equal(response.cookies.get(idleName).maxAge,0);assert.doesNotMatch(response.headers.get('set-cookie'),/unrelated/);
 const page=await proxy(new NextRequest('https://ledger.example/'));assert.equal(page.status,303);assert.equal(page.headers.get('location'),'https://ledger.example/login');
 const oldPage=await proxy(new NextRequest('https://ledger.example/',{headers:{cookie:`${authName}.0=old-session`}}));assert.equal(oldPage.headers.get('location'),'https://ledger.example/login?reason=inactive');
 const login=await proxy(new NextRequest('https://ledger.example/login'));assert.equal(login.headers.get('x-middleware-next'),'1');
 const signIn=await proxy(new NextRequest('https://ledger.example/login',{method:'POST'}));assert.equal(signIn.headers.get('x-middleware-next'),'1');
});

test('even a correctly signed expired cookie is rejected before provider refresh can keep it alive',async()=>{
 const previous=process.env.DATABASE_URL;process.env.DATABASE_URL=env.DATABASE_URL;
 try {
  const idle=idleCookieOptions().name,auth=idle.replace('idle','auth');
  const expired=signIdleCookie('user','session',Date.now()-IDLE_TIMEOUT_MS-1,env);
  const response=await proxy(new NextRequest('https://ledger.example/api/ledger',{headers:{cookie:`${idle}=${expired}; ${auth}.0=provider-refresh-token-still-present`}}));
  assert.equal(response.status,401);assert.equal(response.cookies.get(idle).maxAge,0);assert.equal(response.cookies.get(auth+'.0').maxAge,0);
 } finally { if(previous===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=previous; }
});
