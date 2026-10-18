import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = ['app/page.tsx', 'app/layout.tsx', 'app/login/page.tsx', 'app/api/ledger/route.ts',
    'hooks/use-mobile.ts', 'app/date-picker.tsx', 'app/manifest.ts', 'public/icons/icon-192.png', 'public/icons/icon-512.png', 'public/icons/apple-touch-icon.png', 'public/icons/maskable-512.png', 'app/trip-fields.tsx', 'app/emi-plans.tsx', 'lib/trip-entry.ts', 'lib/trip-view.ts', 'supabase/schema.sql', '.gitignore', '.vercelignore', '.env.example', '.npmrc', '.nvmrc',
    'vercel.json', 'next.config.ts', 'tsconfig.json', 'package.json', 'package-lock.json'];
try {
    if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error('Use Node.js 24.x (run nvm use if nvm is installed).');
    for (const file of required) if (!existsSync(join(root, file))) throw new Error(`Missing required file: ${file}`);
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
    for (const key of ['dependencies', 'devDependencies', 'engines'])
        if (JSON.stringify(manifest[key]) !== JSON.stringify(lock.packages[''][key]))
            throw new Error(`package.json and package-lock.json disagree on ${key}. Run npm install and commit both files.`);
    for (const [name, pkg] of Object.entries(lock.packages)) {
        if (name && !pkg.link && !pkg.version) throw new Error(`Missing locked version: ${name}`);
        for (const dependency of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) {
            let parent = name || '.';
            while (!lock.packages[posix.join(parent, 'node_modules', dependency)]) {
                const next = posix.dirname(parent);
                if (next === parent) throw new Error(`Missing locked dependency: ${name || 'root'} -> ${dependency}`);
                parent = next;
            }
        }
    }
    function walk(dir) {
        return readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory()
            ? walk(join(dir, item.name)) : [join(dir, item.name)]);
    }
    const sources = ['app', 'components', 'hooks', 'lib', 'db', 'scripts', 'tests']
        .flatMap(folder => walk(join(root, folder))).concat(join(root, 'proxy.ts'));
    for (const file of sources.filter(file => /\.(?:[cm]?[jt]sx?)$/.test(file))) {
        const text = readFileSync(file, 'utf8');
        for (const match of text.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)["']([^"']+)["']/g)) {
            const specifier = match[1];
            if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue;
            const target = specifier.startsWith('@/') ? join(root, specifier.slice(2)) : resolve(dirname(file), specifier);
            const candidates = [target, ...['.ts', '.tsx', '.mts', '.mjs', '.js'].map(ext => target + ext),
                ...['.ts', '.tsx', '.mjs', '.js'].map(ext => join(target, 'index' + ext))];
            if (/\.[cm]?js$/.test(target)) candidates.push(...['.ts', '.tsx', '.mts'].map(ext => target.replace(/\.[cm]?js$/, ext)));
            if (!candidates.some(existsSync)) throw new Error(`Missing local import: ${relative(root, file)} -> ${specifier}`);
        }
    }
    console.log('Deployment source and complete dependency lockfile checks passed.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
