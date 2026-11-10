/**
 * Cleanup safety net: must pass before the cleanup starts and after every step.
 * Proves deletions only touch code the running app never loads.
 * Plan: ../../tasks/todo.md ("Dead-code cleanup").
 */
const fs = require('fs');
const path = require('path');
const {ROOT, build, readBaseline} = require('../scripts/cleanup/importGraph');
const manifest = require('../scripts/cleanup/manifest');

jest.setTimeout(60000);

let g;
beforeAll(() => {
  g = build();
});

const exists = rel => fs.existsSync(path.join(ROOT, rel));
const pkg = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

describe('every import still resolves', () => {
  it('no new broken relative import', () => {
    const broken = g.brokenFiles.map(b => `${b.from} -> ${b.spec}`);
    const fresh = broken.filter(b => !manifest.knownBrokenImports.includes(b));
    expect(fresh).toEqual([]);
  });

  it('no new named import resolves to nothing (undefined at runtime, no bundle error)', () => {
    const missing = g.missingNamedImports.map(m => `${m.from} -> ${m.spec} {${m.name}}`);
    const fresh = missing.filter(m => !manifest.knownMissingNamedImports.includes(m));
    expect(fresh).toEqual([]);
  });

  it('no import of a package missing from dependencies', () => {
    const names = [...new Set(g.missingPackages.map(m => m.name))];
    const fresh = names.filter(n => !manifest.knownUndeclaredPackages.includes(n));
    expect(fresh).toEqual([]);
  });
});

describe('nothing the app loads was dropped', () => {
  it('every file reachable at baseline is still reachable (except deliberate removals)', () => {
    const lost = readBaseline().filter(
      f => !g.reachable.has(f) && !manifest.deleteReachable.includes(f),
    );
    expect(lost).toEqual([]);
  });

  it('entry points and navigators are reachable', () => {
    ['index.js', 'App.js', 'src/components/AppNavigation/AppNavigation.js'].forEach(f =>
      expect(g.reachable.has(f)).toBe(true),
    );
  });
});

describe('manifest: files to delete', () => {
  it.each(manifest.deleteFiles)('%s is gone or unreachable', rel => {
    expect(g.reachable.has(rel)).toBe(false);
  });

  it('no file imports a deleted file by path (tests and scripts included)', () => {
    const gone = manifest.deleteFiles.filter(f => !exists(f));
    if (!gone.length) return;
    const stems = gone.map(f => path.basename(f).replace(/\.(js|svg|bak)$/, ''));
    const offenders = [];
    const walk = dir => {
      for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
        if (['node_modules', 'ios', 'android', 'vendor', '.git'].includes(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(j|t)sx?$/.test(e.name) && !p.includes('scripts/cleanup')) {
          const src = fs.readFileSync(p, 'utf8');
          stems.forEach(s => {
            if (new RegExp(`['"/]${s.replace(/[.*+?^${}()|[\]\\ ]/g, '\\$&')}['"]`).test(src)) {
              offenders.push(`${path.relative(ROOT, p)} -> ${s}`);
            }
          });
        }
      }
    };
    walk(ROOT);
    expect(offenders).toEqual([]);
  });
});

describe('manifest: dependencies', () => {
  it.each(Object.entries(manifest.deleteDeps))(
    '%s is only imported where the binding is unused',
    (name, deadImports) => {
      const users = [...(g.packageUsers.get(name) || [])];
      expect(users.filter(u => !deadImports.includes(u))).toEqual([]);
      users.forEach(u => {
        const src = fs.readFileSync(path.join(ROOT, u), 'utf8');
        const importLine = new RegExp(`^import\\s+(\\w+)\\s+from\\s+['"]${name}['"];?$`, 'm');
        const m = src.match(importLine);
        expect(m).not.toBeNull();
        const rest = src.replace(importLine, '');
        expect(rest).not.toMatch(new RegExp(`\\b${m[1]}\\b`)); // binding never used
      });
    },
  );

  it.each(Object.entries(manifest.keepDeps))('%s stays installed (%s)', name => {
    expect(pkg().dependencies).toHaveProperty(name);
  });
});
