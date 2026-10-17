# PIKU Holidays Ledger — main project

Updated 17 October 2026. Use **/Users/pikachu/Documents/ChatGPT/PH-Ledger** as the main working folder. This is the folder connected to GitHub repository Re-Nj-U/PH-Ledger. Earlier ZIPs and the PIKU-Holidays-Ledger folder are separate copies; changes there do not update this repository.

## Run and check this folder

1. Open PH-Ledger in VS Code. Check that package.json is directly inside the folder.
2. Use Node.js **24.x**. If nvm is installed, run `nvm install` followed by `nvm use` in this folder.
3. Run `npm ci` to install the exact locked dependencies.
4. Run `npm run verify`. It runs the tests, source/lockfile check, production build and TypeScript check in order. It does not connect to your real database.
5. For local sign-in, copy `.env.example` to `.env.local` and fill in the four required values privately. Vercel settings do not automatically appear on your computer. Never upload this file or financial backups to GitHub.
6. Run `npm run deployment:check` to check your configured Supabase connection, private tables and disabled public signup. If the server certificate needs Supabase's CA, follow the certificate instructions in docs/VERCEL-GO-LIVE.md. Do not disable certificate verification.
7. Run `npm run dev` and open the Local URL printed in Terminal.

## Deploy through your existing repository

Commit and push source changes from **PH-Ledger** to the existing GitHub repository. Keep package.json and package-lock.json together. Keep all hidden configuration files tracked, including .gitignore, .vercelignore, .npmrc, .nvmrc and .env.example.

In Vercel use **Next.js**, root directory **./**, **Node 24.x**, install command **npm ci**, and build command **npm run build**. The prebuild step checks required files, local imports and the complete dependency lockfile. Keep the four required Production variables from `.env.example`; add the optional server-only DATABASE_SSL_CA if your connection needs it. Deploy the latest pushed commit.

The audit results and remaining live checks are in [docs/DEPLOYMENT-AUDIT.md](docs/DEPLOYMENT-AUDIT.md). Local build success is not confirmation of a successful Vercel deployment or full ASVS compliance. Follow [docs/VERCEL-GO-LIVE.md](docs/VERCEL-GO-LIVE.md) before importing real records.
