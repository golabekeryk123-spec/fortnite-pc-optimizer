'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { start, supportedNode } = require('../scripts/start.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'Veyra folder & spaces-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'package.json'), '{}');
  fs.writeFileSync(path.join(root, 'package-lock.json'), '{"lockfileVersion":3}');
  const nodePath = path.join(root, 'Node runtime', 'node.exe');
  const npmPath = path.join(root, 'Node runtime', 'node_modules', 'npm', 'bin', 'npm-cli.js');
  fs.mkdirSync(path.dirname(npmPath), { recursive: true });
  fs.writeFileSync(npmPath, '');
  function install() {
    for (const relative of ['node_modules/electron/dist/electron.exe', 'node_modules/vite/bin/vite.js', 'node_modules/typescript/bin/tsc']) {
      const target = path.join(root, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, '');
    }
  }
  return { root, nodePath, npmPath, install, options: { root, nodePath, platform: 'win32', version: '24.0.0', log: () => {} } };
}

test('double-click launcher installs and starts in its own folder, including paths with spaces and ampersands', t => {
  const f = fixture(t); const calls = [];
  start({ ...f.options, execute: (exe, args, options) => {
    calls.push({ exe, args, options });
    assert.equal(options.cwd, f.root);
    assert.equal(options.shell, false);
    assert.equal(exe, f.nodePath);
    assert.equal(args[0], f.npmPath);
    if (args[1] === 'ci') f.install();
    return { status: 0 };
  } });
  assert.deepEqual(calls.map(c => c.args.slice(1)), [['ci', '--include=dev', '--no-fund'], ['run', 'desktop']]);
  assert.ok(fs.existsSync(path.join(f.root, '.local', 'windows-install.sha256')));
});

test('successful installation is reused and a changed lockfile triggers a refresh', t => {
  const f = fixture(t); const calls = [];
  const execute = (_exe, args) => { calls.push(args[1]); if (args[1] === 'ci') f.install(); return { status: 0 }; };
  start({ ...f.options, execute });
  start({ ...f.options, execute });
  assert.deepEqual(calls, ['ci', 'run', 'run']);
  fs.appendFileSync(path.join(f.root, 'package-lock.json'), '\n');
  start({ ...f.options, execute });
  assert.deepEqual(calls, ['ci', 'run', 'run', 'ci', 'run']);
});

test('failed install never starts the app or records success', t => {
  const f = fixture(t); let count = 0;
  assert.throws(() => start({ ...f.options, execute: () => { count++; return { status: 1 }; } }), /nie zakonczyla/);
  assert.equal(count, 1);
  assert.equal(fs.existsSync(path.join(f.root, '.local', 'windows-install.sha256')), false);
});

test('missing Electron download is detected even when npm returns a successful exit', t => {
  const f = fixture(t);
  assert.throws(() => start({ ...f.options, execute: () => ({ status: 0 }) }), /nie pobrala/);
  assert.equal(fs.existsSync(path.join(f.root, '.local', 'windows-install.sha256')), false);
});

test('incomplete extraction, missing npm and unsupported Node give actionable errors before any command', t => {
  const f = fixture(t); const execute = () => assert.fail('no commands should execute');
  fs.rmSync(path.join(f.root, 'package-lock.json'));
  assert.throws(() => start({ ...f.options, execute }), /Rozpakuj CALY ZIP/);
  fs.writeFileSync(path.join(f.root, 'package-lock.json'), '{}');
  fs.rmSync(f.npmPath);
  assert.throws(() => start({ ...f.options, execute }), /Nie znaleziono npm/);
  assert.throws(() => start({ ...f.options, execute, version: '18.0.0' }), /Node.js 22.12/);
  assert.throws(() => start({ ...f.options, execute, platform: 'linux' }), /Windows/);
  assert.equal(supportedNode('22.11.0'), false);
  assert.equal(supportedNode('22.12.0'), true);
  assert.equal(supportedNode('24.0.0'), true);
});
