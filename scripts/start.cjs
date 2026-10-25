'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function supportedNode(version) {
  const [major, minor] = String(version).split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 12);
}

function start({ root = PROJECT_ROOT, platform = process.platform, version = process.versions.node,
  nodePath = process.execPath, execute = spawnSync, log = console.log } = {}) {
  if (platform !== 'win32') throw new Error('Ten plik uruchamia aplikacje w Windows. Podglad na Linux: npm run dev.');
  if (!supportedNode(version)) throw new Error('Potrzebny jest Node.js 22.12 lub nowszy. Zainstaluj aktualny Node.js LTS z https://nodejs.org/');
  const manifest = path.join(root, 'package.json');
  const lockfile = path.join(root, 'package-lock.json');
  if (!fs.existsSync(manifest) || !fs.existsSync(lockfile)) throw new Error('Brakuje plikow projektu. Rozpakuj CALY ZIP i ponownie otworz URUCHOM_VEYRA.cmd.');

  // Official Windows Node.js distributions include npm beside node.exe.
  // Both executable and argument lists are passed without a command shell.
  const npmCli = path.join(path.dirname(nodePath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (!fs.existsSync(npmCli)) throw new Error('Nie znaleziono npm. Zainstaluj Node.js LTS z https://nodejs.org/ z domyslnymi opcjami.');
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === 'ELECTRON_SKIP_BINARY_DOWNLOAD') delete env[key];
  }
  const markerDir = path.join(root, '.local');
  const markerPath = path.join(markerDir, 'windows-install.sha256');
  const hash = createHash('sha256').update(fs.readFileSync(lockfile)).digest('hex');
  let savedHash;
  try { savedHash = fs.readFileSync(markerPath, 'utf8').trim(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const required = ['node_modules/electron/dist/electron.exe', 'node_modules/vite/bin/vite.js', 'node_modules/typescript/bin/tsc'];

  function run(args) {
    const result = execute(nodePath, [npmCli, ...args], { cwd: root, env, stdio: 'inherit', shell: false, windowsHide: false });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('Operacja nie zakonczyla sie poprawnie. Komunikat bledu jest powyzej. Sprawdz polaczenie z Internetem i ponow probe.');
  }
  if (hash !== savedHash || required.some(file => !fs.existsSync(path.join(root, file)))) {
    log('Pierwsze uruchomienie: pobieram potrzebne pliki. To moze potrwac kilka minut.');
    log('Zostaw to okno otwarte i poczekaj.');
    run(['ci', '--include=dev', '--no-fund']);
    if (required.some(file => !fs.existsSync(path.join(root, file)))) throw new Error('Instalacja nie pobrala wszystkich potrzebnych plikow. Zachowaj komunikaty z tego okna.');
    fs.mkdirSync(markerDir, { recursive: true });
    fs.writeFileSync(markerPath, hash + '\n');
  }
  log('Uruchamiam Veyra. Poczekaj na pojawienie sie okna programu.');
  run(['run', 'desktop']);
}

if (require.main === module) {
  try { start(); } catch (error) { console.error('\n' + error.message); process.exitCode = 1; }
}
module.exports = { start, supportedNode };
