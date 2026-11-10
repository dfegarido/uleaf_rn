/**
 * Static import graph of the app, resolved the way Metro does (relative paths,
 * platform extensions, index files, package names). Used by the cleanup safety net
 * (__tests__/cleanupSafetyNet.test.js) to prove deletions never break an import
 * and never drop a file the running app reaches.
 *
 *   node scripts/cleanup/importGraph.js                  # print summary
 *   node scripts/cleanup/importGraph.js --write-baseline # snapshot reachable files
 */
const fs = require('fs');
const path = require('path');
const {builtinModules} = require('module');
const {parse} = require('@babel/parser');

const ROOT = path.resolve(__dirname, '..', '..');
const ENTRIES = ['index.js'];
const BASELINE = path.join(__dirname, 'reachable-baseline.json');

// Same order Metro tries (platform first). Both platforms are followed.
const SOURCE_EXTS = ['js', 'jsx', 'ts', 'tsx', 'cjs', 'mjs', 'json', 'svg'];
const PLATFORM_EXTS = ['ios', 'android', 'native'];
const CODE_RE = /\.(c|m)?(j|t)sx?$/;

// Virtual modules provided by Babel plugins, not packages on disk.
const VIRTUAL = new Set(['@env']);

function candidates(base) {
  const out = [base];
  for (const ext of SOURCE_EXTS) {
    for (const p of PLATFORM_EXTS) out.push(`${base}.${p}.${ext}`);
    out.push(`${base}.${ext}`);
  }
  return out;
}

const isFile = p => fs.existsSync(p) && fs.statSync(p).isFile();

/** Every file a relative specifier can resolve to (ios + android variants). */
function resolveRelative(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const hits = candidates(base).filter(isFile);
  if (hits.length) return platformSet(hits);
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    const idx = candidates(path.join(base, 'index')).filter(isFile);
    if (idx.length) return platformSet(idx);
  }
  return [];
}

// If foo.ios.js / foo.android.js exist, Metro never loads plain foo.js on device.
function platformSet(hits) {
  const plat = hits.filter(h => /\.(ios|android|native)\.[^.]+$/.test(h));
  return plat.length ? plat : [hits[0]];
}

function packageName(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function parseFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ts = /\.tsx?$/.test(file);
  return parse(src, {
    sourceType: 'unambiguous',
    errorRecovery: true,
    plugins: ts ? ['typescript', 'jsx'] : ['jsx', 'flow', 'classProperties'],
  });
}

const nameOf = n => (n.type === 'StringLiteral' ? n.value : n.name);

/**
 * One parse per file:
 *  imports: [{spec, names}] from import / export-from / require() / import().
 *           names = imported binding names ('default', '*' for namespace),
 *           or null when unknown (require, dynamic import).
 *  exports: {names: Set, stars: [spec], cjs} - stars are `export * from`.
 */
function analyze(file) {
  const imports = [];
  const exp = {names: new Set(), stars: [], cjs: false};
  const visit = node => {
    if (!node || typeof node.type !== 'string') return;
    switch (node.type) {
      case 'ImportDeclaration':
        imports.push({
          spec: node.source.value,
          names: node.specifiers.map(s =>
            s.type === 'ImportDefaultSpecifier' ? 'default'
              : s.type === 'ImportNamespaceSpecifier' ? '*'
                : nameOf(s.imported)),
        });
        break;
      case 'ExportAllDeclaration':
        imports.push({spec: node.source.value, names: []});
        exp.stars.push(node.source.value);
        break;
      case 'ExportNamedDeclaration': {
        const d = node.declaration;
        if (d?.id) exp.names.add(d.id.name);
        d?.declarations?.forEach(v => v.id.type === 'Identifier' && exp.names.add(v.id.name));
        node.specifiers.forEach(s => exp.names.add(nameOf(s.exported)));
        if (node.source) {
          imports.push({
            spec: node.source.value,
            names: node.specifiers.map(s =>
              s.type === 'ExportNamespaceSpecifier' ? '*' : nameOf(s.local)),
          });
        }
        break;
      }
      case 'ExportDefaultDeclaration':
        exp.names.add('default');
        break;
      case 'MemberExpression':
        if (node.object.type === 'Identifier' &&
            (node.object.name === 'module' && node.property.name === 'exports' ||
             node.object.name === 'exports')) exp.cjs = true;
        break;
      case 'CallExpression': {
        const c = node.callee;
        const arg = node.arguments[0];
        const isReq = (c.type === 'Identifier' && c.name === 'require') || c.type === 'Import';
        if (isReq && arg?.type === 'StringLiteral') imports.push({spec: arg.value, names: null});
        break;
      }
      case 'ImportExpression':
        if (node.source?.type === 'StringLiteral') imports.push({spec: node.source.value, names: null});
        break;
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end') continue;
      const v = node[key];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object') visit(v);
    }
  };
  visit(parseFile(file).program);
  return {imports, exp};
}

function build() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = new Set(Object.keys(pkg.dependencies || {}));
  const reachable = new Set();
  const brokenFiles = []; // {from, spec}
  const missingPackages = []; // {from, spec, name}
  const packageUsers = new Map(); // name -> Set(rel files)
  const exportsOf = new Map(); // rel -> {names, stars: [rel targets], cjs}
  const namedImports = []; // {from, spec, targets: [rel], names}
  const queue = ENTRIES.map(e => path.join(ROOT, e));

  while (queue.length) {
    const file = queue.pop();
    const rel = path.relative(ROOT, file);
    if (reachable.has(rel)) continue;
    reachable.add(rel);
    if (!CODE_RE.test(file)) continue; // assets, json, svg: leaves

    const {imports, exp} = analyze(file);
    exportsOf.set(rel, {
      names: exp.names,
      cjs: exp.cjs,
      stars: exp.stars.flatMap(s => resolveRelative(file, s).map(t => path.relative(ROOT, t))),
    });
    for (const {spec, names} of imports) {
      if (spec.startsWith('.') || spec.startsWith('/')) {
        const hits = resolveRelative(file, spec);
        if (!hits.length) brokenFiles.push({from: rel, spec});
        else if (names?.length) {
          namedImports.push({from: rel, spec, names, targets: hits.map(t => path.relative(ROOT, t))});
        }
        queue.push(...hits);
        continue;
      }
      if (VIRTUAL.has(spec)) continue;
      const name = packageName(spec);
      if (builtinModules.includes(name) || name.startsWith('node:')) continue;
      if (!packageUsers.has(name)) packageUsers.set(name, new Set());
      packageUsers.get(name).add(rel);
      if (!deps.has(name)) missingPackages.push({from: rel, spec, name});
    }
  }

  // Where a name exported by `rel` is actually defined, following `export *` chains
  // (`export *` never forwards `default`). null = not exported; 'unknown' = CommonJS.
  const originOf = (rel, name, seen = new Set()) => {
    const e = exportsOf.get(rel);
    if (!e) return 'unknown'; // asset / json / svg: whatever the transformer gives
    if (e.names.has(name)) return rel;
    if (seen.has(rel)) return null;
    seen.add(rel);
    if (name !== 'default') {
      for (const t of e.stars) {
        const o = originOf(t, name, seen);
        if (o) return o;
      }
    }
    return e.cjs ? 'unknown' : null;
  };

  // Named imports that resolve to nothing: undefined at runtime, no bundle error.
  const missingNamedImports = [];
  const usedNames = new Map(); // origin rel -> Set(names imported from it, directly or via barrels)
  for (const imp of namedImports) {
    for (const name of imp.names) {
      for (const t of imp.targets) {
        if (name === '*') {
          // namespace import: every export of the target counts as used
          usedNames.set(t, new Set([...(usedNames.get(t) || []), '*']));
          continue;
        }
        const o = originOf(t, name);
        if (o === null) missingNamedImports.push({from: imp.from, spec: imp.spec, name});
        else if (o !== 'unknown') usedNames.set(o, new Set([...(usedNames.get(o) || []), name]));
      }
    }
  }
  return {reachable, brokenFiles, missingPackages, packageUsers, deps,
    exportsOf, missingNamedImports, usedNames};
}

function readBaseline() {
  return JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
}

module.exports = {ROOT, BASELINE, build, readBaseline};

if (require.main === module) {
  const g = build();
  console.log(`reachable files: ${g.reachable.size}`);
  console.log(`broken relative imports: ${g.brokenFiles.length}`);
  g.brokenFiles.forEach(b => console.log(`  ${b.from} -> ${b.spec}`));
  console.log(`imports of packages not in dependencies: ${g.missingPackages.length}`);
  g.missingPackages.forEach(m => console.log(`  ${m.from} -> ${m.spec}`));
  const unused = [...g.deps].filter(d => !g.packageUsers.has(d));
  console.log(`dependencies no reachable file imports: ${unused.join(', ') || 'none'}`);
  console.log(`named imports that resolve to nothing: ${g.missingNamedImports.length}`);
  g.missingNamedImports.forEach(m => console.log(`  ${m.from} -> ${m.spec} {${m.name}}`));
  if (process.argv.includes('--write-baseline')) {
    fs.writeFileSync(BASELINE, JSON.stringify([...g.reachable].sort(), null, 1) + '\n');
    console.log(`wrote ${path.relative(ROOT, BASELINE)}`);
  }
}
