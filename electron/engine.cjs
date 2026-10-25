'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { StringDecoder } = require('node:string_decoder');

const TWEAK_IDS = Object.freeze([
  'game-mode', 'dvr-background', 'dvr-appcapture', 'dvr-audio', 'dvr-cursor', 'gamebar-startup',
  'transparency', 'window-animations', 'taskbar-animations', 'menu-delay', 'explorer-shadows',
  'explorer-thumbnails', 'taskbar-widgets', 'taskbar-news', 'taskbar-search', 'search-highlights', 'meet-now',
  'mouse-acceleration', 'mouse-trails', 'keyboard-delay', 'keyboard-repeat',
  'advertising-id', 'tailored-experiences', 'start-tracking', 'recent-documents', 'search-suggestions',
  'text-personalization', 'ink-personalization', 'settings-notifications', 'background-apps',
  'delivery-suggestions', 'oem-apps', 'suggested-apps', 'silent-apps', 'windows-tips', 'welcome-screen',
  'start-suggestions', 'settings-suggestions', 'lock-screen-spotlight', 'lock-screen-tips', 'sync-notifications',
  'power-high-performance', 'power-no-sleep', 'power-no-monitor-off', 'power-usb-suspend',
  'power-pcie-linkstate', 'power-disk-timeout',
  'fortnite-vsync', 'fortnite-motion-blur', 'fortnite-fps', 'fortnite-fps-limit', 'fortnite-resolution',
  'fortnite-view-distance', 'fortnite-antialiasing', 'fortnite-shadows', 'fortnite-illumination',
  'fortnite-reflections', 'fortnite-postprocess', 'fortnite-textures', 'fortnite-effects',
  'fortnite-foliage', 'fortnite-shading', 'fortnite-nanite',
]);
const allowedTweaks = new Set(TWEAK_IDS);
const cleanupIds = new Set(['user-temp', 'windows-temp']);
const allowedActions = new Set(['scan', 'inspect', 'apply', 'restore', 'restore-point', 'cleanup-preview', 'cleanup-run']);
const POWERSHELL_HOST_COMMAND = '& ([scriptblock]::Create([System.IO.File]::ReadAllText($env:VEYRA_ENGINE_SCRIPT))) -Action $env:VEYRA_ENGINE_ACTION';

function engineError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validateIds(ids, allowed = allowedTweaks) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 ||
      ids.some(id => typeof id !== 'string' || !allowed.has(id)) || new Set(ids).size !== ids.length) {
    throw engineError('INVALID_SELECTION', 'Nieprawidłowa lub pusta lista wybranych opcji.');
  }
  return [...ids];
}

function powershellRunner(scriptPath, spawnProcess = spawn) {
  return (action, payload = {}) => new Promise((resolve, reject) => {
    if (!allowedActions.has(action)) return reject(engineError('INVALID_ACTION', 'Nieznana operacja systemowa.'));
    // Static host command reads ONLY the bundled script. Renderer data remains JSON on stdin.
    // No ExecutionPolicy override or machine/user policy changes; AppLocker/WDAC still apply.
    const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const child = spawnProcess(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', POWERSHELL_HOST_COMMAND], {
      windowsHide: true,
      env: { ...process.env, VEYRA_ENGINE_SCRIPT: scriptPath, VEYRA_ENGINE_ACTION: action },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const stdoutDecoder = new StringDecoder('utf8');
    const stderrDecoder = new StringDecoder('utf8');
    let tooLarge = false;
    const timer = setTimeout(() => {
      child.kill();
      reject(engineError('TIMEOUT', 'Operacja Windows przekroczyła limit czasu. Sprawdź historię przed ponowieniem.'));
    }, action === 'restore-point' ? 180_000 : 120_000);
    child.stdout.on('data', chunk => {
      stdout += stdoutDecoder.write(chunk);
      if (stdout.length > 8 * 1024 * 1024) { tooLarge = true; child.kill(); }
    });
    child.stderr.on('data', chunk => { stderr = (stderr + stderrDecoder.write(chunk)).slice(-16000); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      stdout += stdoutDecoder.end();
      stderr += stderrDecoder.end();
      if (tooLarge) return reject(engineError('OUTPUT_LIMIT', 'Przekroczono limit odpowiedzi skanera.'));
      let result;
      try { result = JSON.parse(stdout.trim().replace(/^\uFEFF/, '')); }
      catch {
        return reject(engineError('POWERSHELL_FAILED',
          'Nie udało się uruchomić silnika Windows. Sprawdź dostępność PowerShell, uprawnienia i zasady kontroli aplikacji. ' + stderr.trim()));
      }
      if (code !== 0 || !result || typeof result !== 'object' || result.ok !== true) return reject(engineError(result?.code || 'WINDOWS_ERROR', result?.message || stderr || 'Operacja Windows nie powiodła się.'));
      resolve(result.data);
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(payload));
  });
}

function createEngine({ userDataPath, platform = process.platform, runner } = {}) {
  if (typeof userDataPath !== 'string' || !path.isAbsolute(userDataPath)) throw new Error('userDataPath must be an absolute application data directory');
  const statePath = path.join(userDataPath, 'tweak-history.json');
  const run = runner || powershellRunner(path.join(__dirname, 'powershell', 'engine.ps1'));
  let queue = Promise.resolve();

  function requireWindows() {
    if (platform !== 'win32') throw engineError('WINDOWS_REQUIRED', 'Zmiany systemowe są dostępne tylko w aplikacji Veyra dla Windows.');
  }
  async function loadState() {
    let state;
    try { state = JSON.parse(await fs.readFile(statePath, 'utf8')); }
    catch (error) {
      if (error.code === 'ENOENT') return { version: 1, tweaks: {}, restorePoints: [] };
      throw engineError('HISTORY_UNREADABLE', 'Nie można odczytać kopii poprzednich ustawień. Plik historii zachowano; napraw go przed zmianami.');
    }
    if (state.version !== 1 || !state.tweaks || typeof state.tweaks !== 'object' || Array.isArray(state.tweaks) ||
        Object.keys(state.tweaks).some(id => !allowedTweaks.has(id)) || !Array.isArray(state.restorePoints) ||
        Object.values(state.tweaks).some(entry => !entry || typeof entry !== 'object' || !entry.snapshot || typeof entry.appliedAt !== 'string')) {
      throw engineError('HISTORY_INVALID', 'Kopia ustawień ma nieprawidłowy format. Nie wykonano żadnych zmian.');
    }
    return state;
  }
  async function saveState(state) {
    await fs.mkdir(userDataPath, { recursive: true });
    const temp = path.join(userDataPath, `.tweak-history-${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temp, JSON.stringify(state, null, 2), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      await fs.rename(temp, statePath);
    } finally { await fs.rm(temp, { force: true }).catch(() => {}); }
  }
  function publicState(state) {
    const applied = {};
    for (const [id, record] of Object.entries(state.tweaks)) applied[id] = { appliedAt: record.appliedAt, recoveryPending: record.status === 'pending' };
    const restorePoints = state.restorePoints.map(({ id, createdAt, description }) => ({ id, createdAt, description }));
    return { applied, restorePoints, lastRestorePoint: restorePoints.at(-1)?.createdAt || null };
  }
  function serialized(callback) {
    const next = queue.then(callback, callback);
    queue = next.catch(() => {});
    return next;
  }

  return {
    async scanner() { requireWindows(); return run('scan'); },
    async getTweakState() { requireWindows(); return publicState(await loadState()); },
    applyTweaks(ids) {
      return serialized(async () => {
        requireWindows();
        const selected = validateIds(ids);
        const state = await loadState();
        const applied = [];
        const failed = [];
        for (const id of selected) {
          if (Object.hasOwn(state.tweaks, id)) {
            if (state.tweaks[id].status === 'pending') failed.push({ id, message: 'Poprzednia operacja została przerwana. Najpierw cofnij tę zmianę.' });
            else applied.push(id);
            continue;
          }
          let snapshot;
          try {
            snapshot = await run('inspect', { id });
            if (!snapshot || typeof snapshot !== 'object') throw new Error('Nieprawidłowa odpowiedź kopii ustawień.');
            state.tweaks[id] = { snapshot, appliedAt: new Date().toISOString(), status: 'pending' };
            // The original values must reach disk BEFORE Windows is modified.
            await saveState(state);
            await run('apply', { id, snapshot });
            state.tweaks[id].status = 'applied';
            await saveState(state);
            applied.push(id);
          } catch (error) {
            let message = error.message;
            if (snapshot && Object.hasOwn(state.tweaks, id)) {
              try {
                await run('restore', { id, snapshot });
                delete state.tweaks[id];
                await saveState(state);
              } catch (rollbackError) {
                message += ' Kopia jest zachowana; cofnięcie wymaga ponowienia: ' + rollbackError.message;
              }
            }
            failed.push({ id, message });
          }
        }
        return { applied, failed, state: publicState(state) };
      });
    },
    undoTweaks(ids) {
      return serialized(async () => {
        requireWindows();
        const selected = validateIds(ids);
        const state = await loadState();
        const applied = [];
        const failed = [];
        // Reverse order restores the active power plan after its settings.
        for (const id of [...selected].reverse()) {
          if (!Object.hasOwn(state.tweaks, id)) { failed.push({ id, message: 'Brak zapisanej kopii tej zmiany.' }); continue; }
          try {
            await run('restore', { id, snapshot: state.tweaks[id].snapshot });
            const record = state.tweaks[id];
            delete state.tweaks[id];
            try { await saveState(state); }
            catch (error) { state.tweaks[id] = record; throw error; }
            applied.push(id);
          } catch (error) { failed.push({ id, message: error.message }); }
        }
        return { applied, failed, state: publicState(state) };
      });
    },
    createRestorePoint() {
      return serialized(async () => {
        requireWindows();
        const state = await loadState();
        const point = await run('restore-point');
        if (!point || typeof point.id !== 'string' || typeof point.createdAt !== 'string') throw engineError('RESTORE_UNCONFIRMED', 'Windows nie potwierdził utworzenia punktu przywracania.');
        state.restorePoints.push(point);
        await saveState(state);
        return publicState(state);
      });
    },
    async previewCleanup() { requireWindows(); return run('cleanup-preview'); },
    runCleanup(ids) {
      return serialized(async () => { requireWindows(); return run('cleanup-run', { ids: validateIds(ids, cleanupIds) }); });
    },
  };
}

module.exports = { createEngine, TWEAK_IDS, validateIds, powershellRunner };
