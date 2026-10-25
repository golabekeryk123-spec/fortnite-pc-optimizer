'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');
const { isIP } = require('node:net');
const { StringDecoder } = require('node:string_decoder');

const PROBE_COUNT = 6;
const INTERNET_HOST = '1.1.1.1';
const MAX_OUTPUT_BYTES = 64 * 1024;
const DIAGNOSTIC_TIMEOUT_MS = 25_000;

function diagnosticError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function roundMs(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Missing ICMP responses are null, never zero-millisecond successes. Jitter here
 * is the mean absolute RTT difference between successive successful responses;
 * it is an ICMP diagnostic metric, not a measurement of game/input latency.
 */
function summarizeReplies(host, replies) {
  if (typeof host !== 'string' || isIP(host) !== 4 ||
      !Array.isArray(replies) || replies.length !== PROBE_COUNT ||
      replies.some(value => value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0))) {
    throw diagnosticError('NETWORK_RESPONSE_INVALID', 'Diagnostyka zwróciła nieprawidłowe wyniki pomiaru.');
  }
  const successful = replies.filter(value => value !== null);
  const received = successful.length;
  let differences = 0;
  for (let index = 1; index < received; index++) {
    differences += Math.abs(successful[index] - successful[index - 1]);
  }
  return {
    host,
    sent: replies.length,
    received,
    averageMs: received ? roundMs(successful.reduce((sum, value) => sum + value, 0) / received) : null,
    minMs: received ? Math.min(...successful) : null,
    maxMs: received ? Math.max(...successful) : null,
    jitterMs: received > 1 ? roundMs(differences / (received - 1)) : null,
  };
}

function runPowerShellDiagnostic() {
  return new Promise((resolve, reject) => {
    // Both the script path and its network destinations are fixed by Veyra.
    // No renderer input, shell, or execution-policy override is accepted.
    const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const scriptPath = path.join(__dirname, 'powershell', 'network.ps1');
    const command = '& ([scriptblock]::Create([IO.File]::ReadAllText($env:VEYRA_NETWORK_SCRIPT)))';
    const child = spawn(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, VEYRA_NETWORK_SCRIPT: scriptPath },
    });
    const decoder = new StringDecoder('utf8');
    let stdout = '';
    let outputBytes = 0;
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => {
      finish(diagnosticError('NETWORK_TIMEOUT', 'Pomiar sieci przekroczył limit 25 sekund. Spróbuj ponownie.'));
      child.kill();
    }, DIAGNOSTIC_TIMEOUT_MS);
    child.stdout.on('data', chunk => {
      if (settled) return;
      outputBytes += chunk.length;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        finish(diagnosticError('NETWORK_OUTPUT_LIMIT', 'Przekroczono limit odpowiedzi diagnostyki sieci.'));
        child.kill();
        return;
      }
      stdout += decoder.write(chunk);
    });
    // Drain stderr without retaining command output or credential information.
    child.stderr.resume();
    child.on('error', () => {
      finish(diagnosticError('NETWORK_START_FAILED', 'Nie można uruchomić systemowego programu PowerShell.'));
    });
    child.on('close', code => {
      if (settled) return;
      stdout += decoder.end();
      let result;
      try { result = JSON.parse(stdout.trim().replace(/^\uFEFF/, '')); }
      catch {
        finish(diagnosticError('NETWORK_SCRIPT_FAILED', 'Diagnostyka PowerShell nie zwróciła wyniku. Sprawdź zasady wykonywania skryptów Windows.'));
        return;
      }
      if (code !== 0 || !result || result.ok !== true) {
        finish(diagnosticError('NETWORK_DIAGNOSTIC_FAILED', 'Nie udało się ukończyć diagnostyki sieci. Sprawdź aktywne połączenie i spróbuj ponownie.'));
        return;
      }
      finish(null, result.data);
    });
  });
}

/** Read-only Windows diagnostic. It does not alter DNS, routes or adapter settings. */
async function diagnoseNetwork({ platform = process.platform, runner } = {}) {
  if (platform !== 'win32') {
    throw diagnosticError('WINDOWS_REQUIRED', 'Rzeczywisty pomiar sieci jest dostępny w aplikacji Veyra dla Windows.');
  }
  if (runner !== undefined && typeof runner !== 'function') {
    throw new TypeError('runner must be a function');
  }
  const raw = await (runner || runPowerShellDiagnostic)();
  if (!raw || typeof raw !== 'object' || !raw.internet || raw.internet.host !== INTERNET_HOST ||
      typeof raw.measuredAt !== 'string' || !Number.isFinite(Date.parse(raw.measuredAt)) ||
      (raw.gateway !== null && (!raw.gateway || typeof raw.gateway !== 'object' || raw.gateway.host === '0.0.0.0'))) {
    throw diagnosticError('NETWORK_RESPONSE_INVALID', 'Diagnostyka zwróciła nieprawidłowy format odpowiedzi.');
  }
  return {
    gateway: raw.gateway === null ? null : summarizeReplies(raw.gateway.host, raw.gateway.replies),
    internet: summarizeReplies(INTERNET_HOST, raw.internet.replies),
    measuredAt: raw.measuredAt,
  };
}

module.exports = { diagnoseNetwork, summarizeReplies };
