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

/** String specifiers from import/export-from/require()/import()/jest.mock(). */
function specifiers(file) {
  const out = [];
  const visit = node => {
    if (!node || typeof node.type !== 'string') return;
    if (
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportAllDeclaration') &&
      node.source
    ) {
      out.push(node.source.value);
    } else if (node.type === 'CallExpression') {
      const c = node.callee;
      const arg = node.arguments[0];
      const isReq =
        (c.type === 'Identifier' && c.name === 'require') || c.type === 'Import';
      if (isReq && arg && arg.type === 'StringLiteral') out.push(arg.value);
    } else if (node.type === 'ImportExpression' && node.source?.type === 'StringLiteral') {
      out.push(node.source.value);
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end') continue;
      const v = node[key];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object') visit(v);
    }
  };
  visit(parseFile(file).program);
  return out;
}

function build() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = new Set(Object.keys(pkg.dependencies || {}));
  const reachable = new Set();
  const brokenFiles = []; // {from, spec}
  const missingPackages = []; // {from, spec, name}
  const packageUsers = new Map(); // name -> Set(rel files)
  const queue = ENTRIES.map(e => path.join(ROOT, e));

  while (queue.length) {
    const file = queue.pop();
    const rel = path.relative(ROOT, file);
    if (reachable.has(rel)) continue;
    reachable.add(rel);
    if (!CODE_RE.test(file)) continue; // assets, json, svg: leaves

    for (const spec of specifiers(file)) {
      if (spec.startsWith('.') || spec.startsWith('/')) {
        const hits = resolveRelative(file, spec);
        if (!hits.length) brokenFiles.push({from: rel, spec});
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
  return {reachable, brokenFiles, missingPackages, packageUsers, deps};
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
  if (process.argv.includes('--write-baseline')) {
    fs.writeFileSync(BASELINE, JSON.stringify([...g.reachable].sort(), null, 1) + '\n');
    console.log(`wrote ${path.relative(ROOT, BASELINE)}`);
  }
}
