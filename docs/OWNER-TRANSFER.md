# Transfer business ownership

Added 19 October 2026. One account is the owner. The previous owner remains an active partner after transfer. Financial partner accounts, contribution balances, trips and other records are unchanged.

## Steps in the application

1. Create the new login in the same Supabase project and confirm its email.
2. While signed in as the current owner, open Settings → People & permissions. Add the new email as an active partner if it is not listed already.
3. Sign in with the new account once and check it can open the ledger. Sign out and return as the current owner.
4. Open Settings → Business owner → Transfer ownership. Select the new email.
5. Type the selected email, enter the current owner's password, tick the role-change confirmation and select Confirm ownership transfer. Enter passwords only in the application, never in chat.
6. The current session becomes a partner immediately. Sign in as the new owner to manage users and business settings.

No SQL migration, additional API key or redeployment is needed to perform a transfer after this feature has been deployed. A login created only in Supabase must also be added in People & permissions. A wrong password, inactive partner, missing/unconfirmed account or account that has never signed in blocks the transfer.

## Implementation and safeguards

The existing same-origin JSON endpoint accepts the separate transferOwnership action. It verifies the signed-in owner, matching recipient email and explicit confirmation, then verifies the current password with an isolated Supabase client. This verification session is not stored in browser cookies and is signed out locally. Passwords and temporary tokens are not placed in audit history.

The database transaction locks the business row and checks its pinned owner Auth ID and revision again. It resolves the recipient Auth ID from auth.users on the server, requires an active partner plus a confirmed, previously signed-in, non-deleted/unbanned account, updates owner_id, promotes the selected member, retains the previous owner as an active partner and writes an ownership transferred audit entry. All changes roll back together if any step fails. Existing ledger writes from an older revision are rejected.

The existing server database role must be able to read the listed auth.users identity/status columns (the standard Supabase postgres connection supports the private server-side lookup). Browser roles receive no additional permissions. The application does not accept a recipient Auth ID from the browser, and no ownership transfer is available in sample mode.

Changing OWNER_EMAIL alone still cannot transfer an existing business: owner_id is authoritative. After a transfer, align OWNER_EMAIL with the new owner when maintaining deployment/bootstrap or command-line import configuration; it is not required for the web application's role change. To reverse a completed transfer, the new owner must explicitly transfer ownership back.

References: [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data), [password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword).

## Verification

Automated PostgreSQL tests cover successful transfer and former-owner partner access, target rejection, password failure, explicit confirmation, attempts by non-owners, stale permissions/revisions, failed-audit rollback and preservation of business records. Browser checks use fictional accounts in a temporary local preview. The production ownership transfer is left to the current owner.
