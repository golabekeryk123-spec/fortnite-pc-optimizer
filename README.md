# Veyra — Twój PC. Pełny potencjał.

Bezpłatny optymalizator Windows 10/11 z polskim interfejsem i profilem dla **AMD Ryzen 7 5700, NVIDIA GeForce RTX 5060 i 32 GB RAM**. Łączy skaner sprzętu, opisany katalog 63 ustawień, porządkowanie plików tymczasowych i możliwość cofania zmian.

Program nie obiecuje konkretnej liczby FPS, redukcji opóźnień ani niższego pingu. Część ustawień ogranicza nagrywanie w tle lub koszt renderowania gry; inne wyłącznie porządkują interfejs i ograniczają sugestie Windows. Opis każdej opcji wyjaśnia jej zakres i kompromisy.

## Funkcje

- **63 darmowe ustawienia**: tryb gry i nagrywanie, interfejs Windows, rejestr, prywatność i sugestie systemu, zasilanie oraz 16 ustawień Fortnite.
- **Skaner Windows**: procesor i rdzenie, karta graficzna i sterownik, pamięć RAM i moduły, system, płyta główna i BIOS, dyski oraz aktywne karty sieciowe. Niedostępne dane pozostają oznaczone, zamiast być zgadywane.
- **Sieć i input lag**: diagnostyka ICMP do wykrytej bramy domyślnej i publicznego celu `1.1.1.1`, po 6 prób na cel. Pokazuje rzeczywistą średnią, minimum, maksimum, jitter i utratę pakietów. To nie jest pomiar pingu do Fortnite ani opóźnienia myszy i obrazu. Siedem rozwijanych poradników prowadzi przez Reflex, Ethernet i SQM, odświeżanie monitora, polling myszy, tryby renderowania Fortnite, stabilny limit klatek i nakładki.
- **Czyszczenie z podglądem**: rzeczywiste liczby plików i rozmiary przed usunięciem. Tylko wybrane lokalizacje plików tymczasowych i pliki starsze niż 7 dni; pliki używane i dowiązania są pomijane.
- **Punkt przywracania Windows**: osobna operacja wymagająca administratora i włączonej ochrony systemu. Utworzenie jest potwierdzane przez system; limit częstotliwości Windows może uniemożliwić kolejny punkt.
- **Cofanie poszczególnych zmian**: wartości sprzed zmiany trafiają do lokalnego pliku historii przed modyfikacją. Cofnięcie ustawień Veyra jest niezależne od systemowego punktu przywracania.
- **Przejrzysty wybór**: krótkie opisy, informacje o restarcie, ostrzeżenia przy kompromisach i podsumowanie wymagające potwierdzenia przed zastosowaniem.

Nie wyłączamy Windows Defendera, aktualizacji zabezpieczeń ani mechanizmów antycheat. Nie stosujemy przypadkowych zmian zegarów, HPET, TCP ani obietnic „zerowego input laga”. Nie czyścimy pamięci shaderów: jej odbudowa może powodować przycięcia.

## Uruchomienie podglądu w przeglądarce

Wymagany Node.js 22.12+ lub 24 LTS i npm. W katalogu repozytorium:

```sh
npm ci
npm run dev
```

Vite nasłuchuje na porcie `5173`. Podgląd wyraźnie oznacza tryb działania. Pokazuje wskazany profil sprzętu, pozwala przeglądać katalog i symulować zastosowanie oraz cofnięcie ustawień. **Przeglądarka nie skanuje Twojego PC, nie tworzy punktów przywracania, nie zmienia rejestru i nie usuwa plików.**

Na maszynie Linux, na której potrzebny jest wyłącznie interfejs, można pominąć pobieranie binarnego Electrona:

```sh
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci
npm run dev
```

To polecenie jest przeznaczone do podglądu. Na Windows wykonaj zwykłe `npm ci`, aby pobrać również Electron.

## Aplikacja desktopowa Windows

Wymagania: Windows 10/11 x64, Node.js, npm i dostępny Windows PowerShell 5.1. W PowerShell lub terminalu, w katalogu repozytorium:

```powershell
npm ci
npm run desktop
```

Polecenie buduje interfejs i uruchamia aplikację Electron. Niektóre ustawienia zasilania, czyszczenie systemowego katalogu tymczasowego oraz punkt przywracania wymagają uruchomienia z uprawnieniami administratora. Używaj swojego zwykłego konta Windows; uruchomienie jako inne konto zmienia również profil użytkownika, którego dotyczą ustawienia HKCU i Fortnite.

Silnik uruchamia Windows PowerShell przez stałe polecenie hosta, które wczytuje wyłącznie dołączony plik `electron/powershell/engine.ps1`. Dane żądania są przekazywane oddzielnie jako JSON; interfejs nie dostarcza poleceń do wykonania. Aplikacja nie ustawia `ExecutionPolicy` i nie zmienia zasad wykonywania na poziomie użytkownika ani komputera. Kontrole AppLocker/WDAC i ograniczenia środowiska zarządzanego nadal obowiązują. Jeżeli blokują silnik, skontaktuj się z administratorem w sprawie dopuszczenia aplikacji. Kod silnika jest pakowany jako rzeczywisty plik poza archiwum ASAR.

### Instalator `.exe`

Na Windows:

```powershell
npm run dist:win
```

Instalator NSIS zostanie zapisany w `release/`. Zainstalowana aplikacja prosi o uprawnienia administratora. Repozytorium nie zawiera certyfikatu podpisu kodu; instalator z własnego lokalnego buildu może być oznaczony przez SmartScreen jako nieznany wydawca. Podpisanie dystrybucji wymaga własnego certyfikatu wydawcy.

## Zalecany przebieg

1. Uruchom skan sprzętu i porównaj wynik ze swoim zestawem. Dane w podglądzie są profilem docelowym, a nie odczytem systemowym.
2. Włącz ochronę systemu w ustawieniach Windows, jeśli jest wyłączona, i utwórz punkt przywracania w Veyra.
3. Zamknij Fortnite przed zmianą konfiguracji gry. Wymagany jest istniejący plik `GameUserSettings.ini`; uruchom grę przynajmniej raz, aby go utworzyła.
4. Zaznacz kilka konkretnych ustawień, przeczytaj ich opis i zatwierdź podsumowanie. Nie zaznaczaj wszystkich opcji automatycznie.
5. Wykonaj restart tylko tam, gdzie jest wymagany, i porównaj grę w tej samej scenie oraz z tym samym limitem FPS.
6. Cofnij niekorzystną zmianę w zakładce **Przywracanie**. Pełne przywracanie systemu wykonuje się przez narzędzie Windows „Przywracanie systemu”.

RTX 5060 obsługuje NVIDIA Reflex, ale jego dostępność i zachowanie zależą od aktualnej wersji Fortnite i sterownika. Dobierz Reflex w menu gry; nie traktuj programowych zmian rejestru jako zamiennika. Wybrany w profilu cel FPS jest preferencją interfejsu, a nie obietnicą wyniku lub automatyczną zmianą limitera.

## Bezpieczeństwo i ograniczenia

- Do silnika trafiają wyłącznie identyfikatory ze stałej listy. Interfejs nie przekazuje dowolnych poleceń ani ścieżek do wykonania.
- Electron używa izolowanego kontekstu, wyłączonego Node.js w rendererze, ograniczonego mostka IPC i blokowania nawigacji do zewnętrznych stron.
- Historia poprzednich wartości jest przechowywana w katalogu danych aplikacji, w pliku `tweak-history.json`. Nie usuwaj go, jeśli chcesz korzystać z cofania.
- Skasowanych plików tymczasowych nie można odtworzyć funkcją cofania ustawień Veyra. Punkt przywracania również nie zastępuje kopii osobistych dokumentów.
- System może ignorować niektóre ustawienia w zależności od wersji, edycji i zasad organizacji. Sam zapis ustawienia nie potwierdza wzrostu wydajności.
- Ustawienia gry mogą być nadpisane przez aktualizację Fortnite albo synchronizację. Aplikacja nie ingeruje w proces gry ani antycheat.
- Nie podajemy fikcyjnych pomiarów FPS, temperatur, pingu, input delay ani potencjalnego miejsca do odzyskania.
- Diagnostyka sieci wysyła niewielką liczbę pakietów ICMP do lokalnego routera i `1.1.1.1`. Jitter oznacza średnią bezwzględną różnicę kolejnych odebranych czasów odpowiedzi; nie jest to test łącza pod obciążeniem. Zapory i operator mogą blokować ICMP, a brak odpowiedzi nie dowodzi awarii Internetu. Podgląd przeglądarkowy nie wysyła pakietów i pozostawia wyniki niezmierzone.
- Czcionki są dołączone lokalnie. Interfejs nie wymaga połączenia z zewnętrzną usługą fontów.

## Budowanie i testy

```sh
npm run build
npm test
npm run test:e2e
```

Testy jednostkowe sprawdzają silnik z kontrolowanym wykonawcą Windows. Testy przeglądarkowe obejmują katalog, filtry, potwierdzanie zmian, tryb symulacji, cofanie, skaner, czyszczenie, preferencję FPS, nawigację mobilną oraz diagnostykę sieci bez fikcyjnych wyników. Domyślnie testy używają systemowego Chromium pod `/usr/bin/chromium`; na innej maszynie wskaż `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` lub zainstaluj przeglądarkę przez `npx playwright install chromium`.

Maszyna chmurowa projektu działa na Linux. Testy interfejsu i jednostkowe **nie zastępują testów integracyjnych na Windows**. Rzeczywiste skanowanie, zapis rejestru, działanie ustawień zasilania, punkt przywracania i odwracanie zmian należy zweryfikować na przeznaczonym do tego komputerze Windows przed szerszą dystrybucją. Nie deklarujemy zweryfikowanego wzrostu wydajności na podanym zestawie ani gotowego, podpisanego instalatora.

## Struktura

```text
src/                         interfejs React + TypeScript
src/data/tweaks.ts            opisy i metadane katalogu
electron/main.cjs             okno i kontrolowany mostek IPC
electron/preload.cjs          API udostępniane interfejsowi
electron/engine.cjs           walidacja, kolejka, kopie i cofanie
electron/powershell/engine.ps1 operacje Windows
tests/                       testy silnika i przeglądarki
```
