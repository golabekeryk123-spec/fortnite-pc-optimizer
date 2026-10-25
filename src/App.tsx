import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, Bell, Check, CheckCheck, ChevronDown,
  ChevronRight, CircleHelp, Command, Cpu, Crosshair, Download, Gamepad2, Gauge,
  HardDrive, Layers3, LayoutDashboard, LoaderCircle, Menu, Microchip, Monitor, MoreHorizontal,
  RotateCcw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, X, Zap,
} from 'lucide-react';
import { tweaks, type Tweak, type TweakCategory } from './data/tweaks';
import { CleanupPanel, RestorePanel, SettingsPanel, SystemPanel } from './components/Panels';
import { LatencyPanel } from './components/LatencyPanel';
import type { CleanupPreview, ScanResult, TweakState } from './types';

type Page = 'dashboard' | 'tweaks' | 'fortnite' | 'latency' | 'system' | 'cleanup' | 'restore' | 'settings';
const emptyState: TweakState = { applied: {}, restorePoints: [], lastRestorePoint: null };
const categoryNames: Record<TweakCategory, string> = { system: 'System', gaming: 'Gaming', network: 'Sieć', privacy: 'Prywatność', visual: 'Interfejs', fortnite: 'Fortnite' };
const pageNames: Record<Page, string> = { dashboard: 'Przegląd', tweaks: 'Optymalizacja', fortnite: 'Fortnite', latency: 'Sieć i input lag', system: 'Mój komputer', cleanup: 'Czyszczenie', restore: 'Przywracanie', settings: 'Ustawienia' };
const targetProfile: ScanResult = {
  cpu: { name: 'AMD Ryzen 7 5700', cores: 8, threads: 16 }, gpu: { name: 'NVIDIA GeForce RTX 5060', vramGB: null, driver: null },
  memory: { totalGB: 32, speedMHz: null, slotsUsed: null }, os: { name: 'Do odczytu w Windows', version: '—', build: '—' },
  board: { manufacturer: '—', model: 'Do odczytu w Windows', bios: '—' }, disks: [], network: [], scannedAt: '',
};
const navigation: { id: Page; icon: typeof Gauge; label: string; count?: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Przegląd' },
  { id: 'tweaks', icon: SlidersHorizontal, label: 'Optymalizacja', count: String(tweaks.length) },
  { id: 'fortnite', icon: Crosshair, label: 'Fortnite' },
  { id: 'latency', icon: Activity, label: 'Sieć i input lag' },
  { id: 'system', icon: Monitor, label: 'Mój komputer' },
  { id: 'cleanup', icon: Trash2, label: 'Czyszczenie' },
  { id: 'restore', icon: RotateCcw, label: 'Przywracanie' },
];
const recommended = tweaks.filter(t => t.recommended && t.risk === 'low' && t.category !== 'fortnite');
const titledState = (state: TweakState): TweakState => ({ ...state, applied: Object.fromEntries(Object.entries(state.applied).map(([id, entry]) => [id, { ...entry, title: tweaks.find(t => t.id === id)?.title ?? id }])) });

function Brand({ small = false }: { small?: boolean }) {
  return <div className={`brand ${small ? 'brand-small' : ''}`}><span className="brand-symbol"><span /></span><span>veyra<span className="brand-period">.</span></span>{!small && <span className="brand-free">FREE</span>}</div>;
}
function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange} className={`toggle ${checked ? 'on' : ''}`}><span /></button>;
}
function HardwareIcon({ type }: { type: 'cpu' | 'gpu' | 'ram' }) {
  const Icon = type === 'cpu' ? Cpu : type === 'gpu' ? Microchip : Layers3;
  return <span className={`hardware-icon ${type}`}><Icon size={24} strokeWidth={1.5} /></span>;
}

export default function App() {
  const isNative = Boolean(window.veyra);
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [state, setState] = useState<TweakState>(emptyState);
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TweakCategory | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [fps, setFps] = useState(() => { try { return Number(localStorage.getItem('veyra-fps')) || 144; } catch { return 144; } });
  const [help, setHelp] = useState(false);
  const notify = (message: string, error = false) => setToast({ message, error });

  useEffect(() => {
    if (isNative) {
      window.veyra!.getTweakState().then(data => setState(titledState(data))).catch(e => notify(String(e), true));
      setScanLoading(true);
      window.veyra!.scanner().then(setScan).catch(e => notify(String(e), true)).finally(() => setScanLoading(false));
    }
  }, [isNative]);
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(null), 6500); return () => clearTimeout(id); } }, [toast]);
  useEffect(() => { try { localStorage.setItem('veyra-fps', String(fps)); } catch { /* preference is optional */ } }, [fps]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') { setModal(false); setHelp(false); setMobileNav(false); } };
    window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener);
  }, []);

  const changePage = (next: Page) => { setPage(next); setMobileNav(false); setSearch(''); setCategory('all'); };
  const toggleSelected = (id: string) => setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const selectedTweaks = tweaks.filter(t => selected.has(t.id) && !state.applied[t.id]);
  const appliedCount = Object.keys(state.applied).length;
  const currentProfile = scan || targetProfile;
  const filtered = useMemo(() => tweaks.filter(t =>
    (page !== 'fortnite' || t.category === 'fortnite') &&
    (category === 'all' || t.category === category) &&
    (riskFilter === 'all' || (riskFilter === 'recommended' ? t.recommended : t.risk === 'low')) &&
    `${t.title} ${t.description} ${categoryNames[t.category]}`.toLocaleLowerCase('pl').includes(search.toLocaleLowerCase('pl'))
  ), [page, category, riskFilter, search]);

  async function runScan() {
    setScanLoading(true);
    try { if (isNative) setScan(await window.veyra!.scanner()); else { setScan(targetProfile); notify('Wyświetlono Twój profil docelowy. Rzeczywisty skan sprzętu jest dostępny w aplikacji Windows.'); } }
    catch (e) { notify(String(e), true); } finally { setScanLoading(false); }
  }
  async function restorePoint() {
    if (!isNative) { notify('Punkt przywracania utworzysz w aplikacji Windows. Podgląd nie zmienia systemu.'); return; }
    setBusy(true);
    try { setState(titledState(await window.veyra!.createRestorePoint())); notify('Utworzono systemowy punkt przywracania.'); }
    catch (e) { notify(String(e), true); } finally { setBusy(false); }
  }
  async function apply() {
    if (!selectedTweaks.length) return;
    setBusy(true);
    try {
      if (isNative) {
        const result = await window.veyra!.applyTweaks(selectedTweaks.map(t => t.id)); setState(titledState(result.state));
        notify(result.failed.length ? `Zastosowano ${result.applied.length} zmian. Nie zastosowano: ${result.failed.map(f => `${f.id}: ${f.message}`).join('; ')}` : `Zastosowano ${result.applied.length} zmian. Ustawienia wymagające restartu zaczną działać po ponownym uruchomieniu.`, result.failed.length > 0);
        setSelected(new Set(result.failed.map(f => f.id)));
      } else {
        setState(previous => ({ ...previous, applied: { ...previous.applied, ...Object.fromEntries(selectedTweaks.map(t => [t.id, { appliedAt: new Date().toISOString(), title: t.title }])) } }));
        setSelected(new Set()); notify(`Symulacja: ${selectedTweaks.length} zmian oznaczono w podglądzie. Ustawienia komputera pozostają bez zmian.`);
      }
      setModal(false); setAcknowledged(false);
    } catch (e) { notify(String(e), true); } finally { setBusy(false); }
  }
  async function undo(ids: string[]) {
    setBusy(true);
    try {
      if (isNative) { const result = await window.veyra!.undoTweaks(ids); setState(titledState(result.state)); notify(result.failed.length ? result.failed.map(f => f.message).join('; ') : 'Przywrócono poprzednie ustawienia.', result.failed.length > 0); }
      else { setState(previous => ({ ...previous, applied: Object.fromEntries(Object.entries(previous.applied).filter(([id]) => !ids.includes(id))) })); notify('Cofnięto zmiany w podglądzie.'); }
    } catch (e) { notify(String(e), true); } finally { setBusy(false); }
  }
  async function previewCleanup() {
    if (!isNative) { notify('Odczyt plików tymczasowych wymaga aplikacji Windows. Przeglądarka nie ma dostępu do Twojego dysku.'); return; }
    setBusy(true); try { setPreview(await window.veyra!.previewCleanup()); } catch (e) { notify(String(e), true); } finally { setBusy(false); }
  }
  async function clean(ids: string[]) {
    if (!isNative) return;
    setBusy(true); try { const result = await window.veyra!.runCleanup(ids); notify(`Usunięto ${result.files} plików (${(result.bytes / 1024 / 1024).toFixed(1)} MB). Pominięto ${result.failedFiles} zablokowanych plików.`); setPreview(await window.veyra!.previewCleanup()); }
    catch (e) { notify(String(e), true); } finally { setBusy(false); }
  }
  function review(ids?: string[]) { if (ids) setSelected(new Set(ids)); setAcknowledged(false); setModal(true); }

  function TweakCard({ tweak }: { tweak: Tweak }) {
    const applied = Boolean(state.applied[tweak.id]);
    const Icon = tweak.category === 'fortnite' ? Crosshair : tweak.category === 'visual' ? Monitor : tweak.category === 'gaming' ? Gamepad2 : tweak.category === 'privacy' ? ShieldCheck : tweak.category === 'network' ? Activity : SlidersHorizontal;
    return <article className={`tweak-card ${selected.has(tweak.id) ? 'selected' : ''} ${applied ? 'applied' : ''}`}>
      <div className="tweak-card-top"><span className="tweak-icon"><Icon size={19} /></span><span className={`risk-badge ${tweak.risk}`}>{tweak.risk === 'low' ? 'Niskie ryzyko' : 'Sprawdź przed zmianą'}</span><Toggle checked={selected.has(tweak.id) || applied} onChange={() => toggleSelected(tweak.id)} disabled={applied || busy} label={`Wybierz: ${tweak.title}`} /></div>
      <h3>{tweak.title}</h3><p>{tweak.description}</p>
      <div className="tweak-benefit"><Zap size={12} />{tweak.benefit}</div>
      {tweak.caution && <details><summary>Co warto wiedzieć <ChevronDown size={12} /></summary><p>{tweak.caution}</p></details>}
      <div className="tweak-card-bottom"><span>{categoryNames[tweak.category]}</span><span>{applied ? <><CheckCheck size={13} /> {state.applied[tweak.id]?.recoveryPending ? 'Cofnij przerwaną zmianę' : isNative ? 'Zastosowano' : 'W podglądzie'}</> : tweak.requiresRestart ? <><RotateCcw size={12} /> Wymaga restartu</> : <><Check size={12} /> Bez restartu</>}</span></div>
    </article>;
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <Brand /><div className="workspace-label">TWÓJ WORKSPACE <span>01</span></div>
      <nav aria-label="Nawigacja główna">{navigation.map(({ id, icon: Icon, label, count }) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => changePage(id)}><Icon size={18} strokeWidth={1.7} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}{id === 'fortnite' && <span className="nav-new">NEW</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="free-card"><div className="free-card-icon"><Sparkles size={18} /></div><strong>Pełna moc. Bez opłat.</strong><p>Każda optymalizacja dostępna.<br />Teraz i zawsze za darmo.</p><span>Żadnych subskrypcji <Check size={12} /></span></div><button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => changePage('settings')}><Settings2 size={18} /><span>Ustawienia</span></button><div className="sidebar-footer"><span className="avatar">E</span><div><strong>Twój komputer</strong><span>Profil gracza</span></div><button className="icon-button" aria-label="Informacje o aplikacji" onClick={() => setHelp(true)}><MoreHorizontal size={18} /></button></div></div>
    </aside>
    {mobileNav && <button className="nav-backdrop" aria-label="Zamknij menu" onClick={() => setMobileNav(false)} />}
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Otwórz menu"><Menu size={19} /></button><span className="breadcrumb-home">Workspace</span><ChevronRight size={13} /><span>{pageNames[page]}</span></div><div className="topbar-right"><span className={`runtime-badge ${isNative ? 'native' : ''}`}><span className="status-dot" />{isNative ? 'Aplikacja Windows' : 'Tryb podglądu'}</span><span className="topbar-separator" /><button className="icon-button" aria-label="Pomoc" onClick={() => setHelp(true)}><CircleHelp size={18} /></button><button className="icon-button notification-button" aria-label="Powiadomienia" onClick={() => notify(isNative ? 'Wszystkie zmiany wykonujesz po zatwierdzeniu. Najpierw utwórz punkt przywracania.' : 'Podgląd interfejsu nie modyfikuje Windows. Pełne funkcje są dostępne w wersji desktopowej.')}><Bell size={18} /><i /></button></div></header>
      <main>
        {page === 'dashboard' && <>
          <div className="page-heading"><div><div className="eyebrow">MNIEJ OPÓŹNIEŃ. WIĘCEJ MOŻLIWOŚCI.</div><h1>Twój PC. Pełny potencjał<span className="accent">.</span></h1><p>Wszystko, czego potrzebujesz, żeby skupić się na grze.</p></div><span className="profile-tag"><span className="status-dot" /> PROFIL GAMINGOWY</span></div>
          <section className="hero-card"><div className="hero-content"><span className="hero-label"><Zap size={13} fill="currentColor" /> STWORZONY DLA TWOJEGO ZESTAWU</span><h2>Każda klatka ma znaczenie.<br /><span>Wydobądź ich więcej.</span></h2><p>Przemyślane ustawienia systemu i Fortnite.<br />Mniej procesów w tle. Więcej miejsca na rozgrywkę.</p><button className="button primary" onClick={() => changePage('tweaks')}>Odkryj optymalizacje <ArrowUpRight size={17} /></button><div className="hero-footnote"><ShieldCheck size={13} /> Odwracalne zmiany <span>·</span> 100% za darmo</div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="art-axis axis-one" /><div className="art-axis axis-two" /><div className="core-chip"><div className="chip-inside"><span className="chip-v">V</span><span>VEYRA ENGINE</span></div></div><span className="floating-tag tag-top"><span /> READY TO PLAY</span><span className="floating-tag tag-bottom"><Activity size={14} /> OPTIMIZE YOUR EDGE</span><span className="art-plus plus-one">+</span><span className="art-plus plus-two">+</span></div></section>
          <section className="hardware-section"><div className="section-label"><h2>Twój zestaw<span>{scan && isNative ? 'Wykryty sprzęt' : 'Profil docelowy'}</span></h2><button className="text-button" onClick={() => changePage('system')}>Pełna specyfikacja <ArrowRight size={14} /></button></div><div className="hardware-grid"><div className="hardware-card"><HardwareIcon type="cpu" /><div><span>PROCESOR</span><h3>{currentProfile.cpu.name.replace('AMD ', '')}</h3><p>{currentProfile.cpu.cores} rdzeni <span>·</span> {currentProfile.cpu.threads} wątków</p></div><span className="hardware-vendor">AMD</span></div><div className="hardware-card"><HardwareIcon type="gpu" /><div><span>KARTA GRAFICZNA</span><h3>{currentProfile.gpu.name.replace('NVIDIA GeForce ', '')}</h3><p>NVIDIA <span>·</span> GeForce RTX</p></div><span className="hardware-vendor nvidia">NVIDIA</span></div><div className="hardware-card"><HardwareIcon type="ram" /><div><span>PAMIĘĆ RAM</span><h3>{currentProfile.memory.totalGB} GB pamięci</h3><p>{currentProfile.memory.speedMHz ? `${currentProfile.memory.speedMHz} MHz` : 'Gotowość do wielozadaniowości'}</p></div><span className="memory-bars" aria-hidden="true"><i /><i /><i /><i /></span></div></div></section>
          <div className="dashboard-grid"><section className="panel-card quick-panel"><div className="card-heading"><div className="heading-with-icon"><span className="square-icon"><SlidersHorizontal size={18} /></span><div><h2>Dobry początek</h2><p>Małe zmiany. Lepsze warunki do gry.</p></div></div><span className="soft-badge">POLECANE</span></div><div className="quick-tweaks">{recommended.slice(0, 3).map(t => <div className="quick-tweak" key={t.id}><div><strong>{t.title}</strong><p>{t.description}</p></div><Toggle label={`Wybierz: ${t.title}`} checked={selected.has(t.id) || Boolean(state.applied[t.id])} disabled={Boolean(state.applied[t.id])} onChange={() => toggleSelected(t.id)} /></div>)}</div><div className="quick-footer"><span><ShieldCheck size={14} /> Najpierw sprawdź wybrane zmiany</span><button className="text-button accent" disabled={!selectedTweaks.length} onClick={() => review()}>Przejrzyj wybór {selectedTweaks.length > 0 && `(${selectedTweaks.length})`} <ArrowRight size={14} /></button></div></section>
          <section className="panel-card fortnite-panel"><div className="card-heading"><div className="heading-with-icon"><span className="square-icon purple"><Crosshair size={19} /></span><div><h2>Gotowy na Battle Royale?</h2><p>Twój profil Fortnite</p></div></div><ArrowUpRight size={18} className="muted" /></div><div className="fortnite-visual"><div className="crosshair-art"><i /><i /><span /></div><div><span className="eyebrow">CELUJ W PŁYNNOŚĆ</span><div className="fps-display">{fps}<span>FPS</span></div><p>Twój cel, nie wynik pomiaru</p></div></div><div className="fortnite-spec"><span><Cpu size={13} /> Ryzen 7 5700</span><span><Microchip size={13} /> RTX 5060</span></div><button className="button secondary full-width" onClick={() => changePage('fortnite')}>Dopasuj ustawienia Fortnite <ArrowRight size={15} /></button></section></div>
          <section className="safety-strip"><span className="safety-icon"><ShieldCheck size={23} strokeWidth={1.5} /></span><div><strong>Dobry plan zaczyna się od kopii zapasowej.</strong><p>Utwórz punkt przywracania, zanim zmienisz ustawienia systemu.</p></div><button className="button subtle" disabled={busy} onClick={restorePoint}>{busy ? <LoaderCircle size={15} className="spin" /> : <RotateCcw size={15} />} Utwórz punkt <ArrowRight size={14} /></button></section>
        </>}
        {(page === 'tweaks' || page === 'fortnite') && <>
          <div className="page-heading"><div><div className="eyebrow">{page === 'fortnite' ? 'TWÓJ ZESTAW. TWOJA ROZGRYWKA.' : 'ŚWIADOMIE ZMIENIAJ USTAWIENIA'}</div><h1>{page === 'fortnite' ? 'Przewaga zaczyna się w ustawieniach' : 'Dostosuj. Zastosuj. Graj'}<span className="accent">.</span></h1><p>{page === 'fortnite' ? 'Ustawienia Fortnite dla Ryzen 7 5700, RTX 5060 i 32 GB RAM. Wybierz balans jakości i płynności.' : `${tweaks.length} darmowych opcji. Każda z opisem działania i możliwością przywrócenia.`}</p></div></div>
          {page === 'fortnite' && <div className="info-banner"><Crosshair size={22} /><div><strong>Najpierw ustawienia gry, potem pomiar.</strong><p>Zamknij Fortnite przed zapisem. Po zmianie sprawdź płynność w tej samej scenie. NVIDIA Reflex włącz w menu gry; nie łącz go z trybem Ultra Low Latency sterownika.</p></div><span className="soft-badge">PROFIL RTX</span></div>}
          <div className="catalog-toolbar"><label className="search-input"><Search size={17} /><input placeholder="Szukaj optymalizacji..." aria-label="Szukaj optymalizacji" value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label="Wyczyść wyszukiwanie" onClick={() => setSearch('')}><X size={14} /></button>}</label><select aria-label="Filtruj optymalizacje" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}><option value="all">Wszystkie opcje</option><option value="recommended">Polecane</option><option value="low">Niskie ryzyko</option></select><button className="button secondary" onClick={() => setSelected(new Set(filtered.filter(t => t.recommended && !state.applied[t.id]).map(t => t.id)))}><CheckCheck size={16} /> Wybierz polecane</button></div>
          {page === 'tweaks' && <div className="category-tabs"><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>Wszystkie <span>{tweaks.length}</span></button>{(Object.keys(categoryNames) as TweakCategory[]).filter(cat => tweaks.some(t => t.category === cat)).map(cat => <button className={category === cat ? 'active' : ''} onClick={() => setCategory(cat)} key={cat}>{categoryNames[cat]}<span>{tweaks.filter(t => t.category === cat).length}</span></button>)}</div>}
          <div className="catalog-count"><span>{filtered.length} {filtered.length === 1 ? 'opcja' : 'opcji'} w tej kategorii</span><span><ShieldCheck size={13} /> Bez wyłączania zabezpieczeń Windows</span></div>
          <div className="tweak-grid">{filtered.map(t => <TweakCard key={t.id} tweak={t} />)}</div>{!filtered.length && <div className="empty-state"><Search size={32} /><h3>Brak pasujących ustawień</h3><p>Spróbuj innego słowa albo zmień wybraną kategorię.</p><button className="button secondary" onClick={() => { setSearch(''); setCategory('all'); setRiskFilter('all'); }}>Wyczyść filtry</button></div>}
          <div className="selection-bar"><span className="selection-number">{selectedTweaks.length}</span><div><strong>Wybrane optymalizacje</strong><span>{isNative ? 'Zastosujesz po przejrzeniu podsumowania' : 'W podglądzie możesz przetestować przebieg zmian'}</span></div><button className="text-button" onClick={() => setSelected(new Set())} disabled={!selected.size}>Wyczyść</button><button className="button primary" disabled={!selectedTweaks.length || busy} onClick={() => review()}>Przejrzyj zmiany <ArrowRight size={16} /></button></div>
        </>}
        {page === 'latency' && <LatencyPanel isNative={isNative} />}
        {page === 'system' && <SystemPanel scan={scan} loading={scanLoading} onScan={runScan} isNative={isNative} />}
        {page === 'cleanup' && <CleanupPanel preview={preview} busy={busy} onPreview={previewCleanup} onClean={clean} isNative={isNative} />}
        {page === 'restore' && <RestorePanel state={state} busy={busy} onCreateRestore={restorePoint} onUndo={undo} isNative={isNative} />}
        {page === 'settings' && <SettingsPanel fps={fps} onFpsChange={setFps} isNative={isNative} />}
        <footer className="main-footer"><span><span className="tiny-logo">v</span> VEYRA <span className="footer-divider">/</span> TWÓJ SPRZĘT. TWOJE ZASADY.</span><span>v1.0.0 <span className="footer-divider">·</span> {isNative ? `${appliedCount} zastosowanych zmian` : 'Podgląd · brak dostępu do systemu'}</span></footer>
      </main>
    </div>
    {toast && <div role="status" className={`toast ${toast.error ? 'error' : ''}`}><span>{toast.error ? <CircleHelp size={20} /> : <ShieldCheck size={20} />}</span><p>{toast.message}</p><button className="icon-button" aria-label="Zamknij powiadomienie" onClick={() => setToast(null)}><X size={16} /></button></div>}
    {modal && <div className="modal-backdrop" onClick={() => !busy && setModal(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={e => e.stopPropagation()}><div className="modal-heading"><span className="square-icon"><SlidersHorizontal size={20} /></span><button className="icon-button" aria-label="Zamknij podsumowanie" disabled={busy} onClick={() => setModal(false)}><X size={19} /></button></div><div className="eyebrow">OSTATNI KROK</div><h2 id="review-title">Twój wybór, pod kontrolą.</h2><p>Sprawdź {selectedTweaks.length} wybranych ustawień. Każdą zapisaną zmianę możesz cofnąć w zakładce Przywracanie.</p><div className="review-list">{selectedTweaks.map(t => <div key={t.id}><Check size={15} /><div><strong>{t.title}</strong><span>{t.caution || t.description}</span></div><button className="icon-button" aria-label={`Usuń: ${t.title}`} onClick={() => toggleSelected(t.id)} disabled={busy}><X size={14} /></button></div>)}</div>{!isNative && <div className="notice">Tryb podglądu: to symulacja. Żadne ustawienia Windows ani pliki gry nie zostaną zmienione.</div>}{isNative && !state.lastRestorePoint && <div className="notice"><strong>Brak utworzonego punktu przywracania.</strong><p>Przed zmianami zalecamy kopię systemu. Jeśli jej utworzenie nie jest możliwe, możesz świadomie kontynuować z kopią poszczególnych ustawień Veyra.</p><button className="text-button" onClick={restorePoint} disabled={busy}>Utwórz punkt przywracania <ArrowUpRight size={14} /></button></div>}<label className="confirmation"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /><span>{isNative ? 'Rozumiem skutki wybranych zmian. Fortnite jest zamknięty, jeśli zmieniam ustawienia gry.' : 'Rozumiem, że testuję podgląd aplikacji.'}</span></label><button className="button primary full-width" disabled={!acknowledged || !selectedTweaks.length || busy} onClick={apply}>{busy ? <LoaderCircle size={17} className="spin" /> : <Zap size={16} />}{isNative ? 'Zastosuj wybrane zmiany' : 'Wypróbuj w podglądzie'}</button></section></div>}
    {help && <div className="modal-backdrop" onClick={() => setHelp(false)}><section className="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e => e.stopPropagation()}><div className="modal-heading"><Brand small /><button className="icon-button" aria-label="Zamknij pomoc" onClick={() => setHelp(false)}><X size={20} /></button></div><h2 id="help-title">Przewaga dzięki świadomym zmianom.</h2><p>Veyra to darmowy optymalizator Windows 10/11 z profilem dla Ryzen 7 5700, RTX 5060 i 32 GB RAM.</p><ol><li>Sprawdź specyfikację w zakładce Mój komputer.</li><li>Utwórz punkt przywracania systemu.</li><li>Wybierz ustawienia i przeczytaj ich opis.</li><li>Porównaj wyniki w tej samej grze i scenie.</li></ol><div className="notice">Aplikacja nie obiecuje konkretnego wzrostu FPS ani niższego pingu. Wyniki zależą od sprzętu, gry, sterowników i połączenia.</div><p>Pełną wersję Windows zbudujesz z repozytorium poleceniem <code>npm run dist:win</code>. Instrukcję znajdziesz w README.</p><button className="button primary full-width" onClick={() => setHelp(false)}>Wszystko jasne <Check size={16} /></button></section></div>}
  </div>;
}
