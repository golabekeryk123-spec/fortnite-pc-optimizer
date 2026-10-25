'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { createEngine, TWEAK_IDS, powershellRunner } = require('../electron/engine.cjs');

async function fixture(t, runner, platform = 'win32') {
  const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'veyra-engine-test-'));
  t.after(() => fs.rm(userDataPath, { recursive: true, force: true }));
  return { engine: createEngine({ userDataPath, platform, runner }), userDataPath };
}
const snapshot = { kind: 'registry', entries: [{ exists: true, value: 1, type: 'DWord' }] };

test('PowerShell host uses static source, host-controlled destinations and JSON-only renderer data', async () => {
  let received;
  let sent = '';
  const scriptPath = 'C:\\Program Files\\Veyra\\electron\\powershell\\engine.ps1';
  const hostileInput = { id: "'; Remove-Item C:\\ -Recurse; #" };
  const runner = powershellRunner(scriptPath, (executable, args, options) => {
    received = { executable, args, options };
    const child = new EventEmitter();
    child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.kill = () => {};
    child.stdin.on('data', data => { sent += data.toString('utf8'); });
    child.stdin.on('finish', () => {
      child.stdout.write('{"ok":true,"data":{"safe":true}}');
      child.emit('close', 0);
    });
    return child;
  });
  assert.deepEqual(await runner('scan', hostileInput), { safe: true });
  assert.equal(received.args.includes('-Command'), true);
  assert.equal(received.args.some(argument => /ExecutionPolicy|Bypass/.test(argument)), false);
  assert.equal(received.args.join(' ').includes(hostileInput.id), false);
  assert.equal(received.options.env.VEYRA_ENGINE_SCRIPT, scriptPath);
  assert.equal(received.options.env.VEYRA_ENGINE_ACTION, 'scan');
  assert.deepEqual(JSON.parse(sent), hostileInput);
  await assert.rejects(runner('arbitrary-command'), { code: 'INVALID_ACTION' });
});

test('native response preserves Polish names split across UTF-8 stream chunks', async () => {
  const value = { name: 'Łącze główne — sprzęt użytkownika' };
  const output = Buffer.from(JSON.stringify({ ok: true, data: value }));
  const split = output.indexOf(Buffer.from('Ł')) + 1;
  const runner = powershellRunner('C:\\Veyra\\engine.ps1', () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.kill = () => {};
    child.stdin.on('finish', () => {
      child.stdout.write(output.subarray(0, split));
      child.stdout.write(output.subarray(split));
      child.emit('close', 0);
    });
    return child;
  });
  assert.deepEqual(await runner('scan'), value);
});

test('malformed native JSON envelope rejects without crashing the host', async () => {
  const runner = powershellRunner('C:\\Veyra\\engine.ps1', () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.kill = () => {};
    child.stdin.on('finish', () => { child.stdout.write('null'); child.emit('close', 0); });
    return child;
  });
  await assert.rejects(runner('scan'), { code: 'WINDOWS_ERROR' });
});

test('renderer input cannot select unknown operations, duplicate IDs or filesystem paths', async t => {
  const calls = [];
  const { engine } = await fixture(t, async (...args) => calls.push(args));
  for (const ids of [[], ['__proto__'], ['constructor'], ['game-mode', 'game-mode'], ['../../Windows'], 'game-mode', [null], new Array(101).fill('game-mode')]) {
    await assert.rejects(engine.applyTweaks(ids), { code: 'INVALID_SELECTION' });
  }
  await assert.rejects(engine.runCleanup(['C:\\']), { code: 'INVALID_SELECTION' });
  assert.equal(calls.length, 0);
});

test('original values are durable before mutation and survive a new engine instance', async t => {
  let userDataPath;
  let appliedCount = 0;
  const calls = [];
  const runner = async (action, payload) => {
    calls.push({ action, payload });
    if (action === 'inspect') return structuredClone(snapshot);
    if (action === 'apply') {
      appliedCount++;
      const saved = JSON.parse(await fs.readFile(path.join(userDataPath, 'tweak-history.json'), 'utf8'));
      assert.deepEqual(saved.tweaks['game-mode'].snapshot, snapshot);
      assert.equal(saved.tweaks['game-mode'].status, 'pending');
      assert.deepEqual(payload.snapshot, snapshot);
    }
    return {};
  };
  const f = await fixture(t, runner);
  userDataPath = f.userDataPath;
  const result = await f.engine.applyTweaks(['game-mode']);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(result.applied, ['game-mode']);
  await f.engine.applyTweaks(['game-mode']);
  assert.equal(appliedCount, 1, 'second apply must preserve the first snapshot');
  const restored = createEngine({ userDataPath, platform: 'win32', runner });
  assert.ok((await restored.getTweakState()).applied['game-mode']);
  const undo = await restored.undoTweaks(['game-mode']);
  assert.deepEqual(calls.at(-1), { action: 'restore', payload: { id: 'game-mode', snapshot } });
  assert.deepEqual(undo.state.applied, {});
});

test('failed writes roll back to the captured original values', async t => {
  const calls = [];
  const { engine } = await fixture(t, async (action, payload) => {
    calls.push({ action, payload });
    if (action === 'inspect') return snapshot;
    if (action === 'apply') throw new Error('Access denied');
    return {};
  });
  const result = await engine.applyTweaks(['game-mode']);
  assert.deepEqual(result.applied, []);
  assert.equal(result.failed[0].message, 'Access denied');
  assert.equal(calls.at(-1).action, 'restore');
  assert.deepEqual(result.state.applied, {});
});

test('an interrupted or failed rollback retains a recovery snapshot and blocks re-apply', async t => {
  let failRestore = true;
  const { engine } = await fixture(t, async action => {
    if (action === 'inspect') return snapshot;
    if (action === 'apply' || (action === 'restore' && failRestore)) throw new Error('Windows busy');
    return {};
  });
  const failed = await engine.applyTweaks(['game-mode']);
  assert.equal(failed.state.applied['game-mode'].recoveryPending, true);
  const repeat = await engine.applyTweaks(['game-mode']);
  assert.equal(repeat.failed.length, 1);
  failRestore = false;
  assert.deepEqual((await engine.undoTweaks(['game-mode'])).state.applied, {});
});

test('concurrent UI requests are serialized without losing saved originals', async t => {
  const events = [];
  const { engine } = await fixture(t, async (action, { id }) => {
    events.push(`${action}:${id}`);
    if (action === 'inspect') {
      await new Promise(resolve => setTimeout(resolve, 10));
      return snapshot;
    }
    return {};
  });
  await Promise.all([engine.applyTweaks(['game-mode']), engine.applyTweaks(['transparency'])]);
  assert.deepEqual(events, ['inspect:game-mode', 'apply:game-mode', 'inspect:transparency', 'apply:transparency']);
  assert.deepEqual(Object.keys((await engine.getTweakState()).applied).sort(), ['game-mode', 'transparency']);
});

test('a corrupt history is preserved and prevents system mutations', async t => {
  const { engine, userDataPath } = await fixture(t, async () => { throw new Error('must not run'); });
  const history = path.join(userDataPath, 'tweak-history.json');
  await fs.writeFile(history, 'not valid JSON');
  await assert.rejects(engine.applyTweaks(['game-mode']), { code: 'HISTORY_UNREADABLE' });
  assert.equal(await fs.readFile(history, 'utf8'), 'not valid JSON');
});

test('restore-point failure is never recorded as success; confirmed point returns TweakState', async t => {
  let confirmed = false;
  const { engine } = await fixture(t, async action => {
    assert.equal(action, 'restore-point');
    if (!confirmed) throw new Error('System Protection disabled');
    return { id: '42', createdAt: '2026-10-25T12:00:00.000Z', description: 'Veyra' };
  });
  await assert.rejects(engine.createRestorePoint(), /System Protection disabled/);
  assert.deepEqual((await engine.getTweakState()).restorePoints, []);
  confirmed = true;
  const state = await engine.createRestorePoint();
  assert.equal(state.restorePoints[0].id, '42');
  assert.equal(state.lastRestorePoint, '2026-10-25T12:00:00.000Z');
});

test('non-Windows calls fail explicitly rather than pretending to modify a machine', async t => {
  const { engine } = await fixture(t, async () => { throw new Error('must not run'); }, 'linux');
  for (const call of [() => engine.scanner(), () => engine.applyTweaks(['game-mode']), () => engine.previewCleanup(), () => engine.createRestorePoint()]) {
    await assert.rejects(call(), { code: 'WINDOWS_REQUIRED' });
  }
});

test('all free catalog options map to actual native allowlisted operations', async () => {
  const source = await fs.readFile(path.join(__dirname, '../electron/powershell/engine.ps1'), 'utf8');
  const nativeIds = [...source.matchAll(/(?:Add-RegistryOperation|Add-FortniteOperation) '([^']+)'|\$operations\['([^']+)'\] =/g)].map(match => match[1] || match[2]);
  assert.equal(TWEAK_IDS.length >= 50, true);
  assert.equal(new Set(TWEAK_IDS).size, TWEAK_IDS.length);
  assert.deepEqual([...nativeIds].sort(), [...TWEAK_IDS].sort());
  const catalog = await fs.readFile(path.join(__dirname, '../src/data/tweaks.ts'), 'utf8');
  const catalogIds = [...catalog.matchAll(/\btweak\(\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
  assert.deepEqual(catalogIds.sort(), [...TWEAK_IDS].sort());
});
