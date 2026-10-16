# PIKU Holidays Ledger — complete source

Updated 16 October 2026. This folder is the complete application, including the dark green theme, Supabase migration, missing-route fixes and repaired npm lockfile.

Use **PIKU-Holidays-Ledger-LATEST.zip** for a fresh local folder or GitHub upload. Earlier files named `Fix.zip` were partial updates; they are not complete applications. Do not combine old partial downloads when starting over.

## Run locally

1. Extract this ZIP into a new folder. Open the inner `piku-holidays-ledger` folder; `package.json` must be directly inside it.
2. Use Node.js **24.x**. If you already use nvm, run `nvm install` and `nvm use` here; `.nvmrc` selects version 24.
3. Run `npm ci`.
4. Copy `.env.example` to `.env.local` and enter the four values privately. Vercel environment variables are not automatically available locally. Do not upload `.env.local` or your ledger backup to GitHub.
5. Run `npm run dev` and open the Local URL printed in your terminal. Port 3000 is usual; if it is occupied, use the actual port printed by Next.js.

## Update Vercel

Upload the contents of this complete source folder into the existing private GitHub repository, preserving folder paths and replacing matching source files. Keep `package.json` at the repository root. GitHub's browser uploader accepts up to 100 files at a time: upload `components/` first, commit, then upload all remaining files and folders. Show hidden files on macOS using Command+Shift+Period so `.npmrc`, `.nvmrc`, `.gitignore`, `.vercelignore` and `.env.example` are included.

Use Next.js, Node 24.x, `npm ci` and `npm run build` in Vercel. Keep the four Production environment variables already configured. Redeploy the updated commit with the previous build cache disabled for this repair.

The npm install failure `Invalid Version:` was reproduced from the older archive. Two optional dependency records in `package-lock.json` had no version. The lockfile was repaired without changing application dependency versions. Always upload `package.json` and `package-lock.json` together.

After deployment succeeds, follow `docs/VERCEL-GO-LIVE.md` to verify login and import your existing backup. `docs/SECURITY-REVIEW.md` records the scoped security review and its outstanding checks; this release is not a full ASVS compliance claim.
