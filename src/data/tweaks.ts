export type TweakCategory = 'system' | 'gaming' | 'network' | 'privacy' | 'visual' | 'fortnite';

export interface Tweak {
  id: string;
  title: string;
  description: string;
  category: TweakCategory;
  risk: 'low' | 'medium';
  recommended: boolean;
  kind: 'registry' | 'power' | 'service' | 'fortnite';
  requiresRestart: boolean;
  benefit: string;
  caution?: string;
}

type TweakOptions = Partial<Pick<Tweak, 'risk' | 'recommended' | 'requiresRestart' | 'caution'>>;

const tweak = (
  id: string,
  title: string,
  description: string,
  category: TweakCategory,
  kind: Tweak['kind'],
  benefit: string,
  options: TweakOptions = {},
): Tweak => ({
  id,
  title,
  description,
  category,
  kind,
  benefit,
  risk: 'low',
  recommended: false,
  requiresRestart: false,
  ...options,
});

// Every ID has a corresponding, allowlisted operation in the Windows engine.
// Recommended does not mean a guaranteed FPS improvement: results depend on the
// game, driver, monitor and existing settings. All features are free.
export const tweaks: Tweak[] = [
  tweak(
    'game-mode', 'Tryb gry Windows',
    'Włącza systemowy Tryb gry, który nadaje uruchomionej grze priorytet w zarządzaniu zasobami.',
    'gaming', 'registry', 'Mniej zakłóceń ze strony systemu podczas rozgrywki.',
    { recommended: true, caution: 'Efekt zależy od obciążenia procesora i aktualnej wersji Windows.' },
  ),
  tweak(
    'dvr-background', 'Nagrywanie gry w tle',
    'Wyłącza rejestrowanie rozgrywki w tle przez Windows Game DVR.',
    'gaming', 'registry', 'Zwalnia zasoby używane przez nagrywanie i buforowanie klipów.',
    { recommended: true, caution: 'Funkcja zapisywania ostatnich chwil rozgrywki w Windows przestanie działać.' },
  ),
  tweak(
    'dvr-appcapture', 'Przechwytywanie przez Game Bar',
    'Wyłącza systemowe przechwytywanie obrazu aplikacji przez Xbox Game Bar.',
    'gaming', 'registry', 'Ogranicza dodatkową pracę systemowego rejestratora.',
    { recommended: true, caution: 'Nie wybieraj, jeśli nagrywasz rozgrywkę za pomocą Xbox Game Bar. Nie dotyczy OBS.' },
  ),
  tweak(
    'dvr-audio', 'Dźwięk w klipach Game DVR',
    'Wyłącza przechwytywanie dźwięku przez rejestrator Windows.',
    'gaming', 'registry', 'Usuwa dodatkową ścieżkę przechwytywania podczas nagrywania klipów.',
    { caution: 'Klipy nagrane rejestratorem Windows mogą nie zawierać dźwięku; efekt jest zależny od aktywnego nagrywania.' },
  ),
  tweak(
    'dvr-cursor', 'Kursor w nagraniach',
    'Wyłącza przechwytywanie wskaźnika myszy w systemowych nagraniach.',
    'gaming', 'registry', 'Upraszcza obraz zapisywany przez Game DVR.',
    { caution: 'Zmienia jedynie nagrania. Przy wyłączonym Game DVR nie daje dodatkowego wzrostu wydajności.' },
  ),
  tweak(
    'gamebar-startup', 'Wskazówki Xbox Game Bar',
    'Ukrywa panel powitalny i podpowiedzi Game Bar przy uruchamianiu gry.',
    'gaming', 'registry', 'Mniej nakładek zasłaniających początek rozgrywki.',
    { recommended: true, caution: 'Nie wyłącza całej aplikacji Xbox Game Bar ani innych jej nakładek.' },
  ),

  tweak(
    'transparency', 'Efekty przezroczystości',
    'Wyłącza półprzezroczystość i rozmycie powierzchni interfejsu Windows.',
    'visual', 'registry', 'Mniej efektów kompozytora na pulpicie.',
    { caution: 'Na RTX 5060 wpływ na FPS w grze zwykle będzie niewielki lub niezauważalny.' },
  ),
  tweak(
    'window-animations', 'Animacje okien',
    'Wyłącza animację minimalizowania i przywracania okien.',
    'visual', 'registry', 'Szybsze wizualnie przełączanie między oknami.',
    { requiresRestart: true, caution: 'To zmiana interfejsu Windows; nie zwiększa bezpośrednio FPS.' },
  ),
  tweak(
    'taskbar-animations', 'Animacje paska zadań',
    'Ogranicza animowane przejścia elementów paska zadań.',
    'visual', 'registry', 'Prostszy i spokojniejszy interfejs pulpitu.',
    { requiresRestart: true, caution: 'Działanie zależy od wersji powłoki Windows.' },
  ),
  tweak(
    'menu-delay', 'Szybsze menu Windows',
    'Ustawia opóźnienie otwierania podmenu Windows na 100 ms.',
    'visual', 'registry', 'Krótsze oczekiwanie na rozwinięcie menu systemowego.',
    { requiresRestart: true, caution: 'Dotyczy menu Windows, a nie opóźnienia wejściowego w Fortnite.' },
  ),
  tweak(
    'explorer-shadows', 'Cienie podpisów na pulpicie',
    'Wyłącza cienie pod nazwami ikon na pulpicie.',
    'visual', 'registry', 'Upraszcza renderowanie pulpitu.',
    { requiresRestart: true, caution: 'Może zmniejszyć czytelność nazw ikon na niektórych tapetach. Bez oczekiwanego wpływu na FPS.' },
  ),
  tweak(
    'explorer-thumbnails', 'Miniatury plików',
    'Zastępuje miniatury obrazów i filmów standardowymi ikonami w Eksploratorze.',
    'visual', 'registry', 'Mniej generowania podglądów w dużych folderach.',
    { requiresRestart: true, caution: 'Stracisz podgląd zawartości zdjęć i filmów w folderach.' },
  ),
  tweak(
    'taskbar-widgets', 'Widżety Windows 11',
    'Ukrywa przycisk widżetów na pasku zadań Windows 11.',
    'visual', 'registry', 'Porządkuje pasek i ogranicza przypadkowe otwieranie panelu.',
    { requiresRestart: true, caution: 'Tylko Windows 11. Ukrycie przycisku nie odinstalowuje silnika widżetów.' },
  ),
  tweak(
    'taskbar-news', 'Wiadomości i zainteresowania',
    'Ukrywa panel wiadomości i pogody na pasku zadań Windows 10.',
    'visual', 'registry', 'Mniej treści informacyjnych na pasku zadań.',
    { requiresRestart: true, caution: 'Tylko Windows 10. Nie wyłącza aktualizacji systemu.' },
  ),
  tweak(
    'taskbar-search', 'Pole wyszukiwania na pasku',
    'Ukrywa rozbudowane pole wyszukiwania na pasku zadań.',
    'visual', 'registry', 'Więcej miejsca i mniej elementów na pasku.',
    { requiresRestart: true, caution: 'Wyszukiwanie w menu Start pozostaje dostępne. Nie wyłącza usługi indeksowania.' },
  ),
  tweak(
    'search-highlights', 'Wyróżnienia wyszukiwania',
    'Wyłącza dynamiczne wyróżnienia i ilustracje w wyszukiwaniu Windows.',
    'visual', 'registry', 'Ogranicza dodatkową treść w panelu wyszukiwania.',
    { requiresRestart: true, caution: 'Obsługa tej preferencji zależy od wydania Windows.' },
  ),
  tweak(
    'meet-now', 'Przycisk Rozpocznij spotkanie',
    'Ukrywa przycisk Meet Now w obszarze powiadomień.',
    'visual', 'registry', 'Usuwa nieużywany skrót z interfejsu systemu.',
    { requiresRestart: true, caution: 'Dotyczy wydań Windows zawierających ten przycisk; nie usuwa aplikacji konferencyjnych.' },
  ),

  tweak(
    'mouse-acceleration', 'Stała prędkość myszy',
    'Wyłącza systemową akcelerację wskaźnika myszy.',
    'system', 'registry', 'Przewidywalny ruch wskaźnika w Windows i aplikacjach bez raw input.',
    { requiresRestart: true, caution: 'Fortnite korzysta z surowego wejścia myszy; zmiana może nie wpłynąć na celowanie ani input lag w grze.' },
  ),
  tweak(
    'mouse-trails', 'Ślady wskaźnika',
    'Wyłącza rysowanie śladów za kursorem myszy.',
    'system', 'registry', 'Czytelniejszy wskaźnik bez dodatkowego efektu wizualnego.',
    { requiresRestart: true, caution: 'Nie zmienia częstotliwości próbkowania myszy ani opóźnienia sprzętu.' },
  ),
  tweak(
    'keyboard-delay', 'Opóźnienie powtarzania klawiszy',
    'Ustawia najkrótszą systemową przerwę przed powtarzaniem przytrzymanego klawisza.',
    'system', 'registry', 'Szybsze powtarzanie podczas pisania i obsługi menu.',
    { requiresRestart: true, caution: 'Nie zmniejsza opóźnienia pierwszego naciśnięcia klawisza ani reakcji Fortnite.' },
  ),
  tweak(
    'keyboard-repeat', 'Tempo powtarzania klawiszy',
    'Ustawia najwyższe standardowe tempo powtarzania klawisza w Windows.',
    'system', 'registry', 'Sprawniejsza nawigacja po polach tekstowych i menu.',
    { requiresRestart: true, caution: 'Nie zwiększa szybkości odczytu klawiatury przez grę. Przytrzymanie może wpisywać więcej znaków.' },
  ),

  tweak(
    'advertising-id', 'Identyfikator reklamowy',
    'Wyłącza korzystanie z identyfikatora reklamowego przez aplikacje Windows.',
    'privacy', 'registry', 'Mniej personalizowanych reklam systemowych.',
    { caution: 'To ograniczenie personalizacji; nie jest mierzalnym przyspieszeniem gry.' },
  ),
  tweak(
    'tailored-experiences', 'Spersonalizowane sugestie',
    'Wyłącza sugestie oparte na danych diagnostycznych użytkownika.',
    'privacy', 'registry', 'Mniej treści dobieranych na podstawie aktywności.',
    { caution: 'Nie wyłącza wymaganej diagnostyki ani zabezpieczeń Windows.' },
  ),
  tweak(
    'start-tracking', 'Historia uruchamianych aplikacji',
    'Wyłącza zapisywanie użycia programów do personalizacji menu Start.',
    'privacy', 'registry', 'Mniej historii aplikacji w profilu użytkownika.',
    { caution: 'Najczęściej używane aplikacje w menu Start mogą przestać się aktualizować.' },
  ),
  tweak(
    'recent-documents', 'Ostatnio otwierane pliki',
    'Wyłącza historię ostatnich dokumentów w menu Start i listach szybkiego dostępu.',
    'privacy', 'registry', 'Mniej przechowywanych skrótów do prywatnych plików.',
    { caution: 'Listy ostatnich dokumentów staną się mniej użyteczne. Nie usuwa samych plików.' },
  ),
  tweak(
    'search-suggestions', 'Podpowiedzi sieciowe wyszukiwania',
    'Ogranicza sugestie internetowe w obsługiwanych polach wyszukiwania Windows.',
    'privacy', 'registry', 'Mniej dodatkowych sugestii podczas lokalnego wyszukiwania.',
    { requiresRestart: true, caution: 'Zakres działania zależy od wersji Windows; nie zmniejsza pingu w grze.' },
  ),
  tweak(
    'text-personalization', 'Personalizacja wpisywania',
    'Ogranicza zbieranie wpisywanego tekstu do systemowej personalizacji.',
    'privacy', 'registry', 'Mniej danych używanych do dopasowywania podpowiedzi.',
    { caution: 'Może ograniczyć jakość podpowiedzi tekstowych; nie wpływa na odczyt klawiszy w grze.' },
  ),
  tweak(
    'ink-personalization', 'Personalizacja pisma odręcznego',
    'Ogranicza zbieranie próbek pisma do personalizacji rozpoznawania.',
    'privacy', 'registry', 'Mniej funkcji personalizacji na komputerze bez rysika.',
    { caution: 'Nie wybieraj, jeśli korzystasz z rozpoznawania pisma odręcznego.' },
  ),
  tweak(
    'settings-notifications', 'Przypomnienia konfiguracji Windows',
    'Wyłącza ponaglenia do dokończenia konfiguracji i prezentowania dodatkowych usług.',
    'privacy', 'registry', 'Mniej przerw i paneli promocyjnych.',
    { caution: 'Nie wyłącza ważnych powiadomień o zabezpieczeniach ani Windows Update.' },
  ),
  tweak(
    'background-apps', 'Aplikacje Store w tle',
    'Ogranicza działanie obsługiwanych aplikacji Microsoft Store w tle dla tego użytkownika.',
    'privacy', 'registry', 'Może zwolnić zasoby zajęte przez nieużywane aplikacje.',
    { risk: 'medium', requiresRestart: true, caution: 'Może opóźnić powiadomienia i synchronizację aplikacji UWP. Nie obejmuje wszystkich programów Win32.' },
  ),
  tweak(
    'delivery-suggestions', 'Treści promowane przez Windows',
    'Wyłącza dostarczanie obsługiwanych treści promocyjnych przez Content Delivery Manager.',
    'privacy', 'registry', 'Mniej promowanych treści w interfejsie systemu.',
    { caution: 'Nie jest to wyłączenie aktualizacji. Nowsze wydania Windows mogą ignorować część tej preferencji.' },
  ),
  tweak(
    'oem-apps', 'Sugestie aplikacji producenta',
    'Wyłącza preferencję promowania dodatkowych aplikacji producenta komputera.',
    'privacy', 'registry', 'Ogranicza przyszłe propozycje dodatkowego oprogramowania.',
    { caution: 'Nie odinstalowuje istniejących aplikacji OEM ani sterowników.' },
  ),
  tweak(
    'suggested-apps', 'Proponowane aplikacje Windows',
    'Wyłącza preferencję automatycznego sugerowania aplikacji fabrycznych.',
    'privacy', 'registry', 'Mniej niezamówionych propozycji aplikacji.',
    { caution: 'Nie usuwa zainstalowanych programów. Obsługa ustawienia zależy od wydania Windows.' },
  ),
  tweak(
    'silent-apps', 'Ciche instalowanie sugestii',
    'Wyłącza zgodę profilu na ciche instalowanie sugerowanych aplikacji konsumenckich.',
    'privacy', 'registry', 'Ogranicza dokładanie zbędnych aplikacji w obsługiwanych wersjach Windows.',
    { caution: 'Nie blokuje instalacji wykonywanych przez użytkownika, administratora ani Windows Update.' },
  ),
  tweak(
    'windows-tips', 'Porady i sztuczki Windows',
    'Wyłącza wyświetlanie systemowych porad i wskazówek promocyjnych.',
    'privacy', 'registry', 'Mniej rozpraszających porad podczas pracy.',
    { caution: 'To porządkowanie interfejsu, bez gwarantowanego wpływu na FPS.' },
  ),
  tweak(
    'welcome-screen', 'Ekran powitalny po aktualizacji',
    'Wyłącza treści powitalne i propozycje wyświetlane po aktualizacji lub logowaniu.',
    'privacy', 'registry', 'Mniej dodatkowych ekranów po uruchomieniu systemu.',
    { caution: 'Nie zmienia instalowania aktualizacji ani kolejności uruchamiania Windows.' },
  ),
  tweak(
    'start-suggestions', 'Sugestie w menu Start',
    'Wyłącza obsługiwane subskrybowane treści promocyjne w menu Start.',
    'privacy', 'registry', 'Czytelniejsze menu z mniejszą liczbą rekomendacji.',
    { caution: 'Część nowszych rekomendacji Windows 11 ma osobne ustawienia.' },
  ),
  tweak(
    'settings-suggestions', 'Promocje w Ustawieniach',
    'Wyłącza sugestie dodatkowych usług w aplikacji Ustawienia.',
    'privacy', 'registry', 'Mniej treści promocyjnych w konfiguracji systemu.',
    { caution: 'Nie usuwa żadnych funkcji systemowych ani subskrypcji.' },
  ),
  tweak(
    'lock-screen-spotlight', 'Rotacja ekranu blokady',
    'Wyłącza automatyczną rotację treści Windows Spotlight na ekranie blokady.',
    'visual', 'registry', 'Statyczny ekran blokady bez rotowanych treści.',
    { caution: 'Może zatrzymać pobieranie nowej zawartości ekranu blokady; nie wpływa bezpośrednio na rozgrywkę.' },
  ),
  tweak(
    'lock-screen-tips', 'Porady na ekranie blokady',
    'Ukrywa promocyjne podpowiedzi nakładane na ekran blokady.',
    'visual', 'registry', 'Czystszy ekran blokady bez dodatkowych komunikatów.',
    { caution: 'Działanie zależy od wybranego rodzaju tła i wersji Windows.' },
  ),
  tweak(
    'sync-notifications', 'Sugestie dostawców synchronizacji',
    'Ukrywa promocyjne powiadomienia dostawców synchronizacji w Eksploratorze.',
    'system', 'registry', 'Mniej dodatkowych banerów w oknach folderów.',
    { caution: 'Nie wyłącza OneDrive ani synchronizacji plików i nie zwalnia zajętego przez nie pasma.' },
  ),

  tweak(
    'power-high-performance', 'Plan Wysoka wydajność',
    'Przełącza system na istniejący plan zasilania Wysoka wydajność.',
    'system', 'power', 'Alternatywny profil do porównania stabilności czasu renderowania klatek.',
    { risk: 'medium', caution: 'Zwiększa pobór energii i temperaturę. Dla Ryzen 7 5700 plan Zrównoważony może być równie szybki; porównaj pomiary.' },
  ),
  tweak(
    'power-no-sleep', 'Bez usypiania podczas zasilania',
    'Ustawia brak automatycznego uśpienia dla bieżącego planu przy zasilaniu z sieci.',
    'system', 'power', 'Komputer nie przerwie długiej sesji lub pobierania przez uśpienie.',
    { caution: 'Nie zwiększa FPS. Komputer nie będzie sam przechodził w uśpienie na zasilaczu.' },
  ),
  tweak(
    'power-no-monitor-off', 'Monitor aktywny na zasilaniu',
    'Wyłącza limit automatycznego wygaszania monitora przy zasilaniu z sieci.',
    'system', 'power', 'Ekran nie wyłączy się podczas długiej nieaktywności wejścia.',
    { caution: 'Nie zmienia częstotliwości odświeżania. Większe zużycie energii; na OLED uważaj na statyczny obraz.' },
  ),
  tweak(
    'power-usb-suspend', 'Selektywne usypianie USB',
    'Wyłącza selektywne wstrzymywanie USB w bieżącym planie na zasilaniu z sieci.',
    'system', 'power', 'Opcja diagnostyczna przy rozłączaniu myszy, klawiatury lub kontrolera.',
    { risk: 'medium', caution: 'Zwiększa zużycie energii urządzeń USB. Nie gwarantuje niższego input lag przy sprawnym sprzęcie.' },
  ),
  tweak(
    'power-pcie-linkstate', 'Oszczędzanie energii PCIe',
    'Wyłącza zarządzanie stanem łącza PCI Express dla zasilania z sieci.',
    'system', 'power', 'Pozwala porównać działanie bez przechodzenia łącza PCIe w stany oszczędzania.',
    { risk: 'medium', caution: 'Może zwiększyć pobór energii. Na RTX 5060 efekt trzeba potwierdzić pomiarem; nie zmienia generacji PCIe.' },
  ),
  tweak(
    'power-disk-timeout', 'Bez zatrzymywania dysku',
    'Wyłącza czasowe zatrzymywanie dysków przy zasilaniu z sieci.',
    'system', 'power', 'Unika oczekiwania na ponowne rozpędzenie mechanicznego dysku HDD.',
    { caution: 'Na SSD zwykle nie daje korzyści. HDD będzie pracował dłużej, zużywając więcej energii.' },
  ),

  tweak(
    'fortnite-vsync', 'Fortnite: synchronizacja pionowa',
    'Wyłącza V-Sync w pliku ustawień Fortnite.',
    'fortnite', 'fortnite', 'Usuwa oczekiwanie na synchronizację, które może zwiększać opóźnienie wejścia.',
    { recommended: true, caution: 'Może powodować rozrywanie obrazu. Przy G-SYNC dobierz limit FPS i ustawienia sterownika do monitora.' },
  ),
  tweak(
    'fortnite-motion-blur', 'Fortnite: rozmycie ruchu',
    'Wyłącza rozmycie obrazu podczas poruszania kamerą.',
    'fortnite', 'fortnite', 'Wyraźniejszy obraz w ruchu i mniej efektów postprocessingu.',
    { recommended: true, caution: 'Efekt zależy od aktualnego trybu renderowania Fortnite.' },
  ),
  tweak(
    'fortnite-fps', 'Fortnite: licznik FPS',
    'Włącza wbudowany licznik klatek na sekundę.',
    'fortnite', 'fortnite', 'Pozwala porównać płynność przed zmianami i po nich.',
    { recommended: true, caution: 'To narzędzie pomiarowe, samo w sobie nie zwiększa FPS ani nie mierzy opóźnienia wejścia.' },
  ),
  tweak(
    'fortnite-fps-limit', 'Fortnite: limit 144 FPS',
    'Ustawia limit 144 klatek na sekundę jako punkt wyjścia do porównania stabilności.',
    'fortnite', 'fortnite', 'Może zmniejszyć wahania czasu klatki i niepotrzebne obciążenie GPU.',
    { caution: 'Nie znamy modelu Twojego monitora. Dla 165/240/360 Hz ustaw odpowiedni limit w grze; 144 FPS nie jest uniwersalnie najlepsze.' },
  ),
  tweak(
    'fortnite-resolution', 'Fortnite: skala 3D 100%',
    'Ustawia skalę renderowania 3D na 100% skonfigurowanej rozdzielczości.',
    'fortnite', 'fortnite', 'Czytelny obraz bez niepotrzebnego supersamplingu ponad rozdzielczość bazową.',
    { caution: 'Przy wcześniejszej skali poniżej 100% obciążenie GPU wzrośnie. DLSS i tryby renderowania mogą zmieniać interpretację tej opcji.' },
  ),
  tweak(
    'fortnite-view-distance', 'Fortnite: zasięg widzenia',
    'Ustawia jakość zasięgu widzenia na poziom niski.',
    'fortnite', 'fortnite', 'Ogranicza szczegółowość i zasięg części elementów otoczenia.',
    { caution: 'Zmniejsza jakość odległych obiektów. Nie zmienia zasięgu widoczności przeciwników według reguł gry.' },
  ),
  tweak(
    'fortnite-antialiasing', 'Fortnite: wygładzanie krawędzi',
    'Ustawia najniższy poziom jakości wygładzania krawędzi w ustawieniach skalowalności.',
    'fortnite', 'fortnite', 'Zmniejsza obciążenie efektami wygładzania w obsługiwanych trybach.',
    { recommended: true, caution: 'Krawędzie mogą bardziej migotać. DLSS/TSR oraz tryb Performance mogą nadpisywać część tej konfiguracji.' },
  ),
  tweak(
    'fortnite-shadows', 'Fortnite: cienie',
    'Ustawia najniższą jakość cieni.',
    'fortnite', 'fortnite', 'Ogranicza jeden z kosztowniejszych efektów graficznych.',
    { recommended: true, caution: 'Obraz będzie mniej szczegółowy; wpływ zależy od trybu renderowania.' },
  ),
  tweak(
    'fortnite-illumination', 'Fortnite: globalne oświetlenie',
    'Ustawia najniższą jakość globalnego oświetlenia.',
    'fortnite', 'fortnite', 'Ogranicza zaawansowane obliczenia oświetlenia, gdy dany tryb ich używa.',
    { recommended: true, caution: 'Zmienia wygląd światła w scenie. W trybie Performance opcja może nie mieć dodatkowego efektu.' },
  ),
  tweak(
    'fortnite-reflections', 'Fortnite: odbicia',
    'Ustawia najniższą jakość odbić w ustawieniach gry.',
    'fortnite', 'fortnite', 'Zmniejsza koszt renderowania odbić w obsługiwanych trybach.',
    { recommended: true, caution: 'Odbicia staną się prostsze lub znikną, zależnie od trybu renderowania.' },
  ),
  tweak(
    'fortnite-postprocess', 'Fortnite: postprocessing',
    'Ustawia najniższą jakość dodatkowych efektów przetwarzania obrazu.',
    'fortnite', 'fortnite', 'Mniej kosztownych efektów końcowego obrazu.',
    { recommended: true, caution: 'Wygląd kontrastu i efektów może się zmienić; nie wszystkie efekty gry są wyłączane.' },
  ),
  tweak(
    'fortnite-textures', 'Fortnite: tekstury dla RTX 5060',
    'Ustawia jakość tekstur na poziom wysoki (2), jako punkt wyjścia dla RTX 5060.',
    'fortnite', 'fortnite', 'Zachowuje czytelność tekstur bez automatycznego wybierania poziomu Epic.',
    { caution: 'Zużycie VRAM zależy od rozdzielczości. Przy przycięciach lub zapełnieniu pamięci karty obniż tekstury w grze; to nie jest maksymalny profil FPS.' },
  ),
  tweak(
    'fortnite-effects', 'Fortnite: efekty',
    'Ustawia najniższą jakość efektów graficznych.',
    'fortnite', 'fortnite', 'Ogranicza obciążenie GPU podczas scen z wieloma efektami.',
    { recommended: true, caution: 'Część efektów wizualnych będzie mniej szczegółowa.' },
  ),
  tweak(
    'fortnite-foliage', 'Fortnite: roślinność',
    'Ustawia najniższą jakość roślinności.',
    'fortnite', 'fortnite', 'Mniej złożonej roślinności do renderowania w obsługiwanych scenach.',
    { recommended: true, caution: 'Zmiana nie usuwa obiektów wymaganych przez zasady gry.' },
  ),
  tweak(
    'fortnite-shading', 'Fortnite: jakość cieniowania',
    'Ustawia najniższy poziom jakości cieniowania materiałów.',
    'fortnite', 'fortnite', 'Prostsze materiały i mniejsze obciążenie w obsługiwanych trybach.',
    { recommended: true, caution: 'Niektóre materiały mogą wyglądać inaczej. Efekt zależy od renderera.' },
  ),
  tweak(
    'fortnite-nanite', 'Fortnite: geometria Nanite',
    'Wyłącza wirtualizowaną geometrię Nanite w ustawieniach Fortnite.',
    'fortnite', 'fortnite', 'Ogranicza zaawansowane efekty geometrii w profilu nastawionym na płynność.',
    { recommended: true, caution: 'Dotyczy obsługiwanych trybów DX12. Zmienia szczegółowość świata; w trybie Performance może nie mieć dodatkowego efektu.' },
  ),
];
