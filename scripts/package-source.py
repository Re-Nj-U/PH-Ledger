"""Package the complete deployable source, excluding credentials and runtime data."""
from pathlib import Path
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'outputs' / 'deployment'
FOLDERS = ('app', 'components', 'hooks', 'lib', 'db', 'public', 'supabase', 'tests', 'docs')
FILES = ('package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json',
         'postcss.config.mjs', 'eslint.config.mjs', 'drizzle.config.ts', 'README.md', 'START-HERE.md',
         '.env.example', '.gitignore', '.vercelignore', '.npmrc', '.nvmrc', 'vercel.json', 'proxy.ts',
         'scripts/setup-database.mjs', 'scripts/check-deployment.mjs',
         'scripts/import-ledger.mts', 'scripts/package-source.py')
sources = set(FILES)
manifest = json.loads((ROOT / 'package.json').read_text())
lock = json.loads((ROOT / 'package-lock.json').read_text())
for group in ('dependencies', 'devDependencies', 'engines'):
    if manifest.get(group) != lock['packages'][''].get(group):
        raise RuntimeError(f'Package manifest and lockfile disagree: {group}')
for name, package in lock['packages'].items():
    if name and not package.get('link') and not package.get('version'):
        raise RuntimeError(f'Incomplete dependency version: {name}')
# Optional platform packages must be locked even when this Mac cannot install them.
for name, package in lock['packages'].items():
    dependencies = {**package.get('dependencies', {}), **package.get('optionalDependencies', {})}
    for dependency in dependencies:
        parent = Path(name or '.')
        while (parent / 'node_modules' / dependency).as_posix() not in lock['packages']:
            if parent == parent.parent:
                raise RuntimeError(f'Missing locked dependency: {name or "root"} -> {dependency}')
            parent = parent.parent
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

def write_archive(destination, names):
    temporary = destination.with_suffix('.new.zip')
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as package:
        for name in sorted(names): package.write(ROOT / name, prefix + name)
    with zipfile.ZipFile(temporary) as package:
        if package.testzip() is not None: raise RuntimeError('ZIP verification failed')
    temporary.replace(destination)

write_archive(archive, sources)
write_archive(OUT / 'PIKU-Holidays-Ledger-LATEST.zip', sources)
print(f'Complete source: {len(sources)} files. LATEST.zip is the complete application; no patch bundle is needed.')
