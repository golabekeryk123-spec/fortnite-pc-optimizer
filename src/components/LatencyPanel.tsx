import { useState } from 'react';
import {
  Activity, ArrowDownUp, Check, ChevronDown, Crosshair, EthernetPort,
  Gamepad2, Gauge, Info, Loader2, Monitor, Mouse, Network, Radio,
  ScanLine, SlidersHorizontal, Timer, TriangleAlert, Wifi,
} from 'lucide-react';
import type { NetworkDiagnostics } from '../types';
import './latency.css';

type Probe = NetworkDiagnostics['internet'];

const guides = [
  {
    icon: Crosshair, tag: 'INPUT DELAY', title: 'NVIDIA Reflex: zacznij od „Wł.”',
    description: 'RTX 5060 obsługuje Reflex. W Fortnite ogranicza on kolejkę renderowania, co może obniżyć opóźnienie między wejściem a wyświetleniem klatki.',
    steps: ['W Fortnite otwórz Ustawienia → Obraz → Zaawansowane ustawienia grafiki.', 'Ustaw NVIDIA Reflex Low Latency na Wł. i porównaj odczuwalną responsywność w tej samej scenie.', 'Wł. + Boost przetestuj osobno. Może utrzymywać wyższe zegary GPU kosztem poboru energii i temperatur; nie zawsze daje dodatkową korzyść.'],
    note: 'Nie wymuszaj równocześnie przypadkowych ustawień „Low Latency Mode” z poradników. Reflex jest zintegrowany z silnikiem gry.',
  },
  {
    icon: EthernetPort, tag: 'SIEĆ', title: 'Ethernet i spokojna kolejka w routerze',
    description: 'Przewód ogranicza wpływ zakłóceń Wi-Fi. SQM w kompatybilnym routerze może ograniczyć wzrost pingu podczas pobierania i wysyłania.',
    steps: ['Podłącz komputer przewodem Ethernet. Wstrzymaj aktualizacje gier i synchronizację chmury na czas rozgrywki.', 'Sprawdź, czy ping rośnie, gdy inne urządzenie wysyła lub pobiera duży plik. Ten panel mierzy połączenie bez generowania obciążenia.', 'Jeśli router obsługuje SQM (np. CAKE lub fq_codel), skonfiguruj je w panelu routera według instrukcji producenta i rzeczywistej przepustowości łącza.'],
    note: 'SQM nie jest automatyczną zmianą Windows. Sama zmiana DNS nie obniża stale pingu do serwera gry.',
  },
  {
    icon: Monitor, tag: 'WYŚWIETLANIE', title: 'Wykorzystaj odświeżanie monitora',
    description: 'Monitor 144/165/240 Hz nie wykorzysta swojego odświeżania, jeśli Windows nadal pracuje w 60 Hz. Sprawdź rzeczywisty aktywny tryb.',
    steps: ['Otwórz Ustawienia Windows → System → Ekran → Ekran zaawansowany.', 'Wybierz właściwy monitor i najwyższą obsługiwaną częstotliwość przy docelowej rozdzielczości.', 'Sprawdź ustawienia OSD monitora i jego tryb gry. Ustawienia redukcji rozmycia lub overdrive oceniaj wizualnie; najwyższa wartość może powodować artefakty.'],
    note: 'Nie podkręcamy monitora i nie tworzymy nieobsługiwanych trybów obrazu.',
  },
  {
    icon: Mouse, tag: 'URZĄDZENIA', title: 'Mysz: stabilne 1000 Hz na początek',
    description: 'Dla Ryzen 7 5700 rozsądnym punktem wyjścia jest 1000 Hz. Wysokie 4000–8000 Hz zwiększa obciążenie CPU i nie w każdej grze poprawia płynność.',
    steps: ['W oficjalnym oprogramowaniu myszy ustaw polling rate na 1000 Hz i zapisz profil w pamięci urządzenia, jeśli to możliwe.', 'Podłącz odbiornik bezpośrednio do komputera, blisko myszy; unikaj przeciążonych hubów i zakłóceń radiowych.', 'Wyższe częstotliwości porównuj w Fortnite, obserwując frametime i przycięcia podczas szybkich ruchów myszy.'],
    note: 'Polling rate myszy, opóźnienie renderowania i ping sieciowy to różne wielkości. Ten test sieci ich nie mierzy.',
  },
  {
    icon: Gamepad2, tag: 'FORTNITE', title: 'Performance Mode czy DirectX 12?',
    description: 'Dla zestawu Ryzen 7 5700 + RTX 5060 porównaj oba tryby. Performance Mode upraszcza obraz; DX12 może zapewnić dobre frametime po przygotowaniu shaderów.',
    steps: ['Zapisz obecne ustawienia i wybierz w Fortnite tryb renderowania, który chcesz przetestować. Uruchom grę ponownie, jeśli jest to wymagane.', 'W DX12 rozegraj kilka powtarzalnych fragmentów, aby przygotować shadery. Pierwsza rozgrywka po zmianie sterownika może przycinać.', 'Porównaj tę samą mapę, rozdzielczość, limit FPS i warunki. Oceniaj też czytelność obrazu, temperatury i stabilność klatek.'],
    note: 'Nie czyść rutynowo cache shaderów. Nie modyfikujemy plików gry ani antycheata.',
  },
  {
    icon: Gauge, tag: 'FRAME PACING', title: 'Stabilne klatki zamiast gonienia maksimum',
    description: 'Dobierz limit FPS, który komputer utrzymuje również w walce. Pełne obciążenie GPU i duże wahania czasu klatki mogą pogarszać responsywność.',
    steps: ['Włącz statystyki Fortnite i porównaj frametime w wymagającej, powtarzalnej scenie.', 'Ustaw limiter w grze na poziomie, który zestaw utrzymuje przez większość rozgrywki. Zmień jedną opcję naraz.', 'Jeśli używasz G-SYNC/VRR, dobierz limit i synchronizację do zakresu odświeżania monitora, korzystając z instrukcji NVIDIA i producenta ekranu.'],
    note: 'Nie podajemy gwarantowanego FPS ani jednego ustawienia V-Sync dla wszystkich monitorów.',
  },
  {
    icon: SlidersHorizontal, tag: 'PROCESY W TLE', title: 'Sprawdź nagrywanie i nakładki',
    description: 'Nagrywanie w tle, nakładki i transmisje mogą konkurować o CPU, GPU oraz łącze. Wyłączaj tylko funkcje, których nie używasz.',
    steps: ['Sprawdź, czy nie działa jednocześnie nagrywanie Xbox Game Bar, NVIDIA App, Discord i OBS.', 'Na próbę wyłącz zbędne nakładki oraz przechwytywanie w tle i porównaj tę samą scenę.', 'Zostaw komunikację głosową i funkcje dostępności, których potrzebujesz. Dostępne przełączniki Windows znajdziesz w zakładce Optymalizacja.'],
    note: 'Nie wyłączamy ochrony systemu, aktualizacji zabezpieczeń ani usług sieciowych wymaganych przez grę.',
  },
];

function ms(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? '—' : value.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

function ProbeCard({ title, subtitle, probe, type, busy }: { title: string; subtitle: string; probe: Probe | null; type: 'gateway' | 'internet'; busy: boolean }) {
  const loss = probe && probe.sent > 0 ? Math.max(0, (probe.sent - probe.received) / probe.sent * 100) : null;
  const Icon = type === 'gateway' ? Wifi : Network;
  return <section className="panel-card vl-probe-card">
    <div className="vl-probe-heading"><span className="vl-probe-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{subtitle}</p></div><span className={`vl-probe-state ${probe && probe.received > 0 ? 'has-result' : ''}`}>{busy ? 'Pomiar…' : probe ? probe.received > 0 ? 'Odpowiedź ICMP' : 'Brak odpowiedzi' : 'Nie zmierzono'}</span></div>
    <div className="vl-ping-number"><strong>{busy ? <Loader2 className="vl-spin" size={31} /> : ms(probe?.averageMs)}</strong><span>ms <span>średni czas odpowiedzi</span></span></div>
    <div className="vl-probe-metrics"><div><span>Minimum</span><strong>{ms(probe?.minMs)} <small>ms</small></strong></div><div><span>Maksimum</span><strong>{ms(probe?.maxMs)} <small>ms</small></strong></div><div><span>Jitter</span><strong>{ms(probe?.jitterMs)} <small>ms</small></strong></div><div><span>Utrata pakietów</span><strong>{ms(loss)} <small>%</small></strong></div></div>
    <div className="vl-probe-footer"><Radio size={12} /><span>{probe ? `${probe.host} · ${probe.received}/${probe.sent} odpowiedzi` : type === 'gateway' ? 'Brama domyślna wykrywana w Windows' : '1.1.1.1 · publiczny cel diagnostyczny'}</span></div>
  </section>;
}

export function LatencyPanel({ isNative }: { isNative: boolean }) {
  const [result, setResult] = useState<NetworkDiagnostics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function diagnose() {
    setError('');
    setNotice('');
    if (!isNative || !window.veyra) {
      setNotice('Pomiar ICMP jest dostępny w aplikacji Windows. Podgląd przeglądarkowy nie wysyła pakietów i nie tworzy przykładowych wyników. Poniższe porady możesz przeczytać już teraz.');
      return;
    }
    setBusy(true);
    try {
      const data = await window.veyra.diagnoseNetwork();
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return <div className="vl-stack">
    <div className="vl-heading"><div><span className="eyebrow">RESPONSYWNOŚĆ ZACZYNA SIĘ OD POMIARU</span><h2>Opóźnienia i sieć</h2><p>Sprawdź połączenie. Dopasuj ustawienia. Porównaj wyniki.</p></div><button className="button primary" disabled={busy} onClick={diagnose}>{busy ? <Loader2 size={17} className="vl-spin" /> : <ScanLine size={17} />}{busy ? 'Trwa pomiar…' : result ? 'Zmierz ponownie' : 'Zmierz połączenie'}</button></div>
    <div className="vl-disclaimer"><Info size={17} /><span>Ping sieciowy i input delay to różne rzeczy. Ten panel mierzy odpowiedzi ICMP do routera i 1.1.1.1. <strong>Nie mierzy pingu do serwerów Fortnite ani opóźnienia myszy i obrazu.</strong></span></div>
    {notice && <div className="vl-inline-notice" role="status"><Info size={18} /><span>{notice}</span></div>}
    {error && <div className="vl-inline-error" role="alert"><TriangleAlert size={18} /><div><strong>Nie udało się wykonać pomiaru</strong><p>{error}</p></div></div>}
    <div className="vl-diagnostic-grid" aria-busy={busy}>
      <ProbeCard title="Twój router" subtitle="Odcinek lokalny · LAN / Wi-Fi" probe={result?.gateway ?? null} type="gateway" busy={busy} />
      <ProbeCard title="Połączenie z Internetem" subtitle="Publiczny cel · 1.1.1.1" probe={result?.internet ?? null} type="internet" busy={busy} />
    </div>
    <div className="vl-measurement-note"><Activity size={14} /><p>{result ? `Pomiar: ${new Date(result.measuredAt).toLocaleString('pl-PL')}. ` : ''}6 prób ICMP na cel, bez testu obciążeniowego łącza. Jitter to średnia bezwzględna różnica pomiędzy kolejnymi otrzymanymi czasami odpowiedzi. Zapora lub operator może ograniczać ICMP; brak odpowiedzi nie oznacza automatycznie awarii Internetu.</p></div>
    <section className="panel-card vl-reading-guide"><div className="vl-reading-title"><ArrowDownUp size={18} /><h3>Jak czytać wyniki?</h3></div><div className="vl-reading-columns"><div><span>01</span><h4>Najpierw połączenie lokalne</h4><p>Wahania czasu odpowiedzi routera mogą wskazywać na Wi-Fi, obciążenie urządzenia lub lokalne kolejki. Porównaj z Ethernetem.</p></div><div><span>02</span><h4>Potem trasa do Internetu</h4><p>Stabilny router i wahania na zewnętrznym celu sugerują dalszy odcinek trasy. Wynik do 1.1.1.1 nie opisuje trasy do Fortnite.</p></div><div><span>03</span><h4>Zweryfikuj w rozgrywce</h4><p>W Fortnite włącz statystyki debugowania sieci. Sprawdź właściwy region dobierania graczy i porównaj kilka meczów.</p></div></div></section>
    <div className="vl-guides-heading"><div><span className="eyebrow">RYZEN 7 5700 + RTX 5060 + 32 GB</span><h3>Praktyczny plan na mniejsze opóźnienia</h3><p>Bezpłatne ustawienia do sprawdzenia ręcznie. Bez automatycznej ingerencji w grę.</p></div><span className="vl-free-label"><Check size={13} />100% darmowe</span></div>
    <div className="vl-guides-grid">{guides.map((guide, index) => <details className="panel-card vl-guide-card" key={guide.title}>
      <summary><div className="vl-guide-top"><span className="vl-guide-icon"><guide.icon size={20} /></span><span className="vl-guide-tag">{guide.tag}</span><ChevronDown className="vl-guide-chevron" size={16} /></div><span className="vl-guide-title">{guide.title}</span><span className="vl-guide-description">{guide.description}</span><span className="vl-guide-expand">Pokaż kroki <span>{String(index + 1).padStart(2, '0')}</span></span></summary>
      <div className="vl-guide-body"><ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol><div className="vl-guide-note"><Info size={14} /><p>{guide.note}</p></div></div>
    </details>)}</div>
    <div className="vl-bottom-note"><Timer size={16} /><span>Bez „magicznych” zmian HPET, zegarów systemowych i TCP. Zmieniaj jedną rzecz naraz, sprawdzaj temperatury oraz frametime i zachowuj ustawienia, które pomagają w Twoich warunkach.</span></div>
  </div>;
}
