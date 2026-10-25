import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowDownToLine, Check, CheckCircle2, CircleHelp,
  Clock3, Cpu, Database, Disc3, Gauge, HardDrive, Info, Layers3, Loader2,
  MemoryStick, Monitor, Network, RotateCcw, ScanLine, ShieldCheck, Sparkles,
  Trash2, TriangleAlert,
} from 'lucide-react';
import type { CleanupPreview, ScanResult, TweakState } from '../types';
import './panels.css';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / 1024 ** unit).toLocaleString('pl-PL', { maximumFractionDigits: unit ? 1 : 0 })} ${['B', 'KB', 'MB', 'GB'][unit]}`;
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data niedostępna' : date.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
}

function NativeNote({ children }: { children?: ReactNode }) {
  return <div className="vp-note"><Info size={17} /><span>{children ?? 'Podgląd aplikacji. Odczyt sprzętu i zmiany systemowe są dostępne w aplikacji na Windows.'}</span></div>;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div className="vp-detail"><span>{label}</span><strong>{value}</strong></div>;
}

export function SystemPanel({ scan, loading, onScan, isNative }: {
  scan: ScanResult | null;
  loading: boolean;
  onScan: () => void;
  isNative: boolean;
}) {
  const actualScan = isNative && scan !== null;
  return <div className="vp-stack">
    <div className="vp-heading-row">
      <div><span className="eyebrow">POZNAJ SWÓJ SPRZĘT</span><h2 className="vp-title">Twój komputer</h2><p className="vp-subtitle">Wszystkie najważniejsze podzespoły. W jednym miejscu.</p></div>
      <button className="button primary" onClick={onScan} disabled={loading}><ScanLine size={17} className={loading ? 'vp-spin' : ''} />{loading ? 'Skanowanie…' : 'Skanuj komputer'}</button>
    </div>
    {!isNative && <NativeNote>Wyświetlamy podany przez Ciebie profil sprzętowy. Dokładny odczyt podzespołów wymaga aplikacji na Windows.</NativeNote>}
    <div className="vp-hardware-grid">
      <div className="panel-card vp-hardware"><span className="vp-icon-box"><Cpu size={23} /></span><span className="vp-card-overline">PROCESOR</span><h3>{actualScan ? scan.cpu.name : 'AMD Ryzen 7 5700'}</h3><p>{actualScan ? `${scan.cpu.cores} rdzeni · ${scan.cpu.threads} wątków` : 'Procesor wskazany w Twoim profilu'}</p><span className="vp-hardware-tag">{actualScan ? 'Odczyt systemowy' : 'Profil docelowy'}</span></div>
      <div className="panel-card vp-hardware"><span className="vp-icon-box"><Monitor size={23} /></span><span className="vp-card-overline">KARTA GRAFICZNA</span><h3>{actualScan ? scan.gpu.name : 'NVIDIA GeForce RTX 5060'}</h3><p>{actualScan ? (scan.gpu.vramGB !== null ? `${scan.gpu.vramGB} GB pamięci VRAM` : 'Pamięć VRAM: brak odczytu') : 'Sterownik i VRAM dostępne po skanowaniu'}</p><span className="vp-hardware-tag">{actualScan ? 'Odczyt systemowy' : 'Profil docelowy'}</span></div>
      <div className="panel-card vp-hardware"><span className="vp-icon-box"><MemoryStick size={23} /></span><span className="vp-card-overline">PAMIĘĆ RAM</span><h3>{actualScan ? scan.memory.totalGB : 32} GB pamięci</h3><p>{actualScan && scan.memory.speedMHz ? `${scan.memory.speedMHz} MHz${scan.memory.slotsUsed ? ` · ${scan.memory.slotsUsed} moduły` : ''}` : 'Częstotliwość dostępna po skanowaniu'}</p><span className="vp-hardware-tag">{actualScan ? 'Odczyt systemowy' : 'Profil docelowy'}</span></div>
    </div>
    <div className="vp-two-column">
      <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><Layers3 size={18} /></span><h3>System i platforma</h3></div><div className="vp-details">
        <Detail label="System operacyjny" value={actualScan ? scan.os.name : 'Odczyt po skanowaniu'} />
        <Detail label="Wersja / kompilacja" value={actualScan ? `${scan.os.version} / ${scan.os.build}` : '—'} />
        <Detail label="Płyta główna" value={actualScan ? `${scan.board.manufacturer} ${scan.board.model}` : '—'} />
        <Detail label="Wersja BIOS" value={actualScan ? scan.board.bios : '—'} />
        <Detail label="Sterownik GPU" value={actualScan ? scan.gpu.driver ?? 'Brak danych' : '—'} />
      </div></section>
      <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><HardDrive size={18} /></span><h3>Przestrzeń dyskowa</h3></div>
        {actualScan && scan.disks.length > 0 ? <div className="vp-drives">{scan.disks.map((disk, index) => <div className="vp-drive" key={`${disk.name}-${index}`}><div><span><Disc3 size={16} />{disk.name}</span><strong>{disk.freeGB.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} GB wolne</strong></div><div className="vp-drive-bar"><span style={{ width: `${disk.totalGB > 0 ? Math.min(100, Math.max(0, (disk.totalGB - disk.freeGB) / disk.totalGB * 100)) : 0}%` }} /></div><small>{disk.totalGB.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} GB łącznie</small></div>)}</div> : <div className="vp-quiet-state"><Database size={30} /><p>{actualScan ? 'System nie zwrócił informacji o dyskach.' : 'Zeskanuj komputer, aby zobaczyć dyski i ilość wolnego miejsca.'}</p></div>}
      </section>
    </div>
    <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><Network size={18} /></span><h3>Połączenie sieciowe</h3><span className="vp-small-label">Bez sztucznego pomiaru pingu</span></div>{actualScan && scan.network.length > 0 ? scan.network.map((adapter, index) => <Detail key={`${adapter.name}-${index}`} label={adapter.name} value={adapter.speedMbps !== null ? `${adapter.speedMbps} Mb/s · prędkość łącza` : 'Prędkość niedostępna'} />) : <p className="vp-muted-text">{actualScan ? 'Nie wykryto aktywnego interfejsu sieciowego.' : 'Lista aktywnych kart sieciowych pojawi się po skanowaniu.'} Prędkość karty sieciowej nie jest pomiarem przepustowości Internetu.</p>}</section>
    {actualScan && <div className="vp-footer-note"><Clock3 size={14} />Ostatni skan: {dateLabel(scan.scannedAt)}</div>}
  </div>;
}

export function CleanupPanel({ preview, busy, onPreview, onClean, isNative }: {
  preview: CleanupPreview | null;
  busy: boolean;
  onPreview: () => void;
  onClean: (ids: string[]) => void;
  isNative: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { setSelected(preview?.items.filter(item => item.files > 0).map(item => item.id) ?? []); }, [preview]);
  const totalBytes = preview?.items.filter(item => selected.includes(item.id)).reduce((sum, item) => sum + item.bytes, 0) ?? 0;
  const totalFiles = preview?.items.filter(item => selected.includes(item.id)).reduce((sum, item) => sum + item.files, 0) ?? 0;
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  return <div className="vp-stack">
    <div className="vp-heading-row"><div><span className="eyebrow">MNIEJ BAŁAGANU, WIĘCEJ MIEJSCA</span><h2 className="vp-title">Czyszczenie komputera</h2><p className="vp-subtitle">Przejrzyj pliki tymczasowe i zdecyduj, co usunąć.</p></div><button className="button secondary" onClick={onPreview} disabled={busy}>{busy ? <Loader2 size={17} className="vp-spin" /> : <ScanLine size={17} />}{busy ? 'Przetwarzanie…' : preview ? 'Skanuj ponownie' : 'Skanuj pliki'}</button></div>
    {!isNative && <NativeNote />}
    <div className="panel-card vp-clean-hero"><div className="vp-clean-orbit"><Sparkles size={39} /></div><div className="vp-clean-hero-copy"><span className="eyebrow">{preview ? 'WYBRANE DO USUNIĘCIA' : 'NAJPIERW SPRAWDŹ, POTEM WYCZYŚĆ'}</span><h3>{preview ? formatBytes(totalBytes) : 'Zrób miejsce na grę.'}</h3><p>{preview ? `${totalFiles.toLocaleString('pl-PL')} plików w ${selected.length} wybranych lokalizacjach` : 'Bez usuwania dokumentów, pobranych plików i zapisów gier.'}</p></div><button className="button primary" disabled={busy || !preview || selected.length === 0 || totalFiles === 0 || !isNative} onClick={() => onClean(selected)}><Trash2 size={17} />Wyczyść wybrane</button></div>
    <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><ArrowDownToLine size={18} /></span><h3>Pliki do uporządkowania</h3>{preview && <span className="vp-small-label">{preview.items.length} lokalizacje</span>}</div>
      {preview ? <div className="vp-clean-items">{preview.items.map(item => <label className={`vp-clean-item ${selected.includes(item.id) ? 'is-selected' : ''}`} key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} disabled={busy || item.files === 0} /><span className="vp-check-visual">{selected.includes(item.id) && <Check size={13} />}</span><span className="vp-clean-item-copy"><strong>{item.label}</strong><span>{item.description}</span><small>{item.files.toLocaleString('pl-PL')} plików</small></span><strong className="vp-clean-size">{formatBytes(item.bytes)}</strong></label>)}</div> : <div className="vp-clean-empty"><span className="vp-empty-icon"><ScanLine size={31} /></span><h3>Zobacz, ile miejsca możesz odzyskać</h3><p>Skanowanie niczego nie usuwa. Najpierw zobaczysz listę lokalizacji i rzeczywisty rozmiar plików.</p><button className="button secondary" onClick={onPreview} disabled={busy}><ScanLine size={16} />Rozpocznij skanowanie</button></div>}
    </section>
    <div className="vp-two-column"><div className="vp-info-tile"><ShieldCheck size={22} /><div><h4>Tylko stare pliki tymczasowe</h4><p>Usuwane są pliki starsze niż 7 dni. Pliki używane przez programy są pomijane.</p></div></div><div className="vp-info-tile"><CircleHelp size={22} /><div><h4>Bez obietnic dodatkowych FPS</h4><p>Czyszczenie zwalnia miejsce. Nie usuwa pamięci shaderów, której odbudowa może powodować przycięcia.</p></div></div></div>
    {preview && <div className="vp-footer-note"><Clock3 size={14} />Skanowanie: {dateLabel(preview.scannedAt)}. Usuniętych plików nie można cofnąć w Veyra.</div>}
  </div>;
}

export function RestorePanel({ state, busy, onCreateRestore, onUndo, isNative }: {
  state: TweakState;
  busy: boolean;
  onCreateRestore: () => void;
  onUndo: (ids: string[]) => void;
  isNative: boolean;
}) {
  const applied = Object.entries(state.applied);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { setSelected(current => current.filter(id => Object.hasOwn(state.applied, id))); }, [state.applied]);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  return <div className="vp-stack">
    <div className="vp-heading-row"><div><span className="eyebrow">ZMIANY POD TWOJĄ KONTROLĄ</span><h2 className="vp-title">Bezpieczeństwo i przywracanie</h2><p className="vp-subtitle">Zapisz punkt przywracania i wracaj do poprzednich ustawień.</p></div></div>
    {!isNative && <NativeNote>Tryb demonstracyjny. Zastosowanie i cofanie modyfikacji zmienia wyłącznie podgląd interfejsu; nie modyfikuje Windows.</NativeNote>}
    <section className="panel-card vp-restore-hero"><span className="vp-restore-shield"><ShieldCheck size={38} /></span><div><span className="eyebrow">ZANIM ZACZNIESZ OPTYMALIZACJĘ</span><h3>Dobry plan zaczyna się od kopii.</h3><p>Punkt przywracania Windows zapisuje stan ustawień systemowych. Nie zastępuje kopii plików osobistych.</p><button className="button primary" onClick={onCreateRestore} disabled={busy}>{busy ? <Loader2 size={17} className="vp-spin" /> : <ShieldCheck size={17} />}Utwórz punkt przywracania</button></div></section>
    <div className="vp-note vp-note-warning"><TriangleAlert size={18} /><span>Wymaga Windows i uprawnień administratora. Ochrona systemu musi być włączona; Windows może ograniczać częstotliwość tworzenia punktów.</span></div>
    <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><Clock3 size={18} /></span><h3>Punkty utworzone przez Veyra</h3><span className="vp-small-label">{state.restorePoints.length} zapisanych</span></div>{state.restorePoints.length ? <div className="vp-history">{[...state.restorePoints].reverse().map(point => <div className="vp-history-item" key={point.id}><span className="vp-history-dot"><CheckCircle2 size={17} /></span><div><strong>{point.description}</strong><span>{dateLabel(point.createdAt)}</span></div><span className="vp-tag">Punkt Windows</span></div>)}</div> : <div className="vp-quiet-state"><Clock3 size={27} /><p>Nie utworzono jeszcze punktu w Veyra. Zacznij od zapisania stanu systemu.</p></div>}<p className="vp-muted-text vp-bottom-note">Pełne przywracanie systemu uruchom z narzędzia „Przywracanie systemu” w Windows.</p></section>
    <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><RotateCcw size={18} /></span><h3>Cofnij swoje modyfikacje</h3><span className="vp-small-label">{applied.length} aktywnych</span></div>{applied.length ? <><div className="vp-undo-toolbar"><label><input type="checkbox" checked={selected.length === applied.length} onChange={event => setSelected(event.target.checked ? applied.map(([id]) => id) : [])} disabled={busy} />Zaznacz wszystkie</label><button className="button secondary" onClick={() => onUndo(selected)} disabled={busy || !selected.length}><RotateCcw size={15} />Cofnij wybrane ({selected.length})</button></div><div className="vp-history">{applied.map(([id, entry]) => <label className="vp-undo-item" key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} disabled={busy} /><div><strong>{entry.title ?? id}</strong><span>{entry.recoveryPending ? 'Przerwana operacja — przywróć zapisaną wartość' : `${isNative ? 'Zastosowano' : 'Symulacja'} ${dateLabel(entry.appliedAt)}`}</span></div><CheckCircle2 size={17} /></label>)}</div></> : <div className="vp-quiet-state"><RotateCcw size={28} /><p>Nie zastosowano żadnych modyfikacji. Po ich wdrożeniu tutaj przywrócisz poprzednie wartości.</p></div>}<p className="vp-muted-text vp-bottom-note">Cofanie wykorzystuje wartości zapisane przez Veyra przed zmianą. Nie cofa czyszczenia plików.</p></section>
  </div>;
}

export function SettingsPanel({ fps, onFpsChange, isNative }: {
  fps: number;
  onFpsChange: (fps: number) => void;
  isNative: boolean;
}) {
  return <div className="vp-stack">
    <div className="vp-heading-row"><div><span className="eyebrow">TWÓJ KOMPUTER, TWOJE ZASADY</span><h2 className="vp-title">Ustawienia</h2><p className="vp-subtitle">Dopasuj profil gry do swojego sprzętu i monitora.</p></div></div>
    <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><Gauge size={18} /></span><h3>Profil Fortnite</h3><span className="vp-tag">Indywidualny</span></div><div className="vp-profile-specs"><div><Cpu size={18} /><span>AMD Ryzen 7 5700</span></div><div><Monitor size={18} /><span>NVIDIA RTX 5060</span></div><div><MemoryStick size={18} /><span>32 GB RAM</span></div></div><div className="vp-setting-block"><div><h4>Docelowa liczba klatek</h4><p>Wybierz cel odpowiedni do odświeżania monitora. Ustawienie służy do dopasowania zaleceń profilu.</p></div><div className="vp-fps-options" role="group" aria-label="Docelowa liczba klatek na sekundę">{[120, 144, 165, 180, 240, 360].map(value => <button key={value} className={fps === value ? 'is-active' : ''} aria-pressed={fps === value} onClick={() => onFpsChange(value)}>{value}<span>FPS</span>{fps === value && <Check size={13} />}</button>)}</div><div className="vp-note"><Info size={16} /><span>Sam wybór celu nie zmienia konfiguracji Fortnite. Limiter, NVIDIA Reflex i ustawienia obrazu dobierz w grze. Nie gwarantujemy osiągnięcia wybranego FPS.</span></div></div></section>
    <section className="panel-card vp-section-card"><div className="vp-card-header"><span className="vp-icon-small"><ShieldCheck size={18} /></span><h3>Zasady działania</h3></div><div className="vp-principles"><div><CheckCircle2 size={19} /><span><strong>Wszystkie modyfikacje są darmowe</strong><p>Bez płatnych profili, subskrypcji i blokowania funkcji.</p></span></div><div><CheckCircle2 size={19} /><span><strong>Twoje dane zostają na komputerze</strong><p>Skan sprzętu i historia zmian nie są wysyłane na serwer Veyra.</p></span></div><div><CheckCircle2 size={19} /><span><strong>Świadoma optymalizacja</strong><p>Bez wyłączania Defendera, aktualizacji zabezpieczeń i bez ingerencji w pliki antycheata.</p></span></div><div><CheckCircle2 size={19} /><span><strong>Zapis poprzednich ustawień</strong><p>Przed modyfikacją zachowujemy wartości potrzebne do jej cofnięcia.</p></span></div></div></section>
    <section className="panel-card vp-about"><div className="vp-about-mark">v<span>·</span></div><div><h3>Veyra <span>1.0.0</span></h3><p>Więcej kontroli. Mniej rozpraszaczy. Twój gamingowy setup.</p></div><span className="vp-tag">{isNative ? 'Aplikacja Windows' : 'Podgląd interfejsu'}</span></section>
    <div className="vp-footer-note"><Info size={14} />Efekty zależą od sprzętu, wersji Windows i ustawień gry. Porównuj wyniki w tej samej scenie i z tym samym limitem FPS.</div>
  </div>;
}
