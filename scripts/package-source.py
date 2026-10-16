"""Package the complete deployable source, excluding credentials and runtime data."""
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'outputs' / 'deployment'
FOLDERS = ('app', 'components', 'hooks', 'lib', 'db', 'public', 'supabase', 'tests', 'docs')
FILES = ('package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json',
         'postcss.config.mjs', 'eslint.config.mjs', 'drizzle.config.ts', 'README.md',
         '.env.example', '.gitignore', '.vercelignore', '.npmrc', 'vercel.json', 'proxy.ts',
         'scripts/setup-database.mjs', 'scripts/check-deployment.mjs',
         'scripts/import-ledger.mts', 'scripts/package-source.py')
sources = set(FILES)
for folder in FOLDERS:
    for path in (ROOT / folder).rglob('*'):
        if path.is_file() and not path.name.startswith('.') and '__pycache__' not in path.parts:
            sources.add(path.relative_to(ROOT).as_posix())

# Catch missing local dependencies, including files referenced by unused UI components.
for name in sources:
    path = ROOT / name
    if path.suffix not in ('.ts', '.tsx', '.mts', '.mjs'): continue
    for specifier in re.findall(r'(?:from\s*|import\s*(?:\(\s*)?)[\"\']([^\"\']+)[\"\']', path.read_text()):
        if specifier.startswith('@/'): target = ROOT / specifier[2:]
        elif specifier.startswith('.'): target = path.parent / specifier
        else: continue
        relative = target.resolve().relative_to(ROOT)
        candidates = [str(relative)] + [str(relative) + ext for ext in ('.ts', '.tsx', '.mts', '.mjs', '.js')]
        if relative.suffix in ('.js', '.mjs'):
            candidates += [relative.with_suffix(ext).as_posix() for ext in ('.ts', '.tsx', '.mts')]
        candidates += [(relative / ('index' + ext)).as_posix() for ext in ('.ts', '.tsx', '.mjs', '.js')]
        if not any(candidate in sources for candidate in candidates):
            raise RuntimeError(f'Missing packaged import: {name} -> {specifier}')

OUT.mkdir(parents=True, exist_ok=True)
archive = OUT / 'PIKU-Holidays-Vercel-Source.zip'
prefix = 'piku-holidays-ledger/'
previous = {}
if archive.exists():
    with zipfile.ZipFile(archive) as old:
        previous = {name.removeprefix(prefix): old.read(name) for name in old.namelist() if not name.endswith('/')}

def write_archive(destination, names):
    temporary = destination.with_suffix('.new.zip')
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as package:
        for name in sorted(names): package.write(ROOT / name, prefix + name)
    with zipfile.ZipFile(temporary) as package:
        if package.testzip() is not None: raise RuntimeError('ZIP verification failed')
    temporary.replace(destination)

changed = [name for name in sources if previous.get(name) != (ROOT / name).read_bytes()]
patch = OUT / 'PIKU-Holidays-Vercel-Fix.zip'
if patch.exists():
    with zipfile.ZipFile(patch) as old:
        changed = sorted(set(changed) | {name.removeprefix(prefix) for name in old.namelist() if name.removeprefix(prefix) in sources})
write_archive(archive, sources)
if changed:
    write_archive(patch, changed)
print(f'Complete source: {len(sources)} files. Update package: {len(changed)} files.')
