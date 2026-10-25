import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('dashboard displays the declared profile and an honest preview status', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Twój PC. Pełny potencjał.' })).toBeVisible();
  await expect(page.getByText('Tryb podglądu', { exact: true })).toBeVisible();
  await expect(page.locator('.hardware-grid')).toContainText('Ryzen 7 5700');
  await expect(page.locator('.hardware-grid')).toContainText('RTX 5060');
  await expect(page.locator('.hardware-grid')).toContainText('32 GB');
  await expect(page.getByText('Profil docelowy', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Odkryj optymalizacje' }).click();
  await expect(page.locator('.tweak-card').first()).toBeVisible();
});

test('at least 50 described tweaks can be filtered and searched', async ({ page }) => {
  await page.getByRole('button', { name: 'Optymalizacja' }).click();
  expect(await page.locator('.tweak-card').count()).toBeGreaterThanOrEqual(50);
  const search = page.getByRole('textbox', { name: 'Szukaj optymalizacji' });
  await search.fill('nieistniejaca-opcja-xyz');
  await expect(page.getByRole('heading', { name: 'Brak pasujących ustawień' })).toBeVisible();
  await expect(page.locator('.tweak-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Wyczyść filtry' }).click();
  expect(await page.locator('.tweak-card').count()).toBeGreaterThanOrEqual(50);
  await page.getByRole('combobox', { name: 'Filtruj optymalizacje' }).selectOption('low');
  await expect(page.locator('.risk-badge.medium')).toHaveCount(0);
  await search.fill('nagrywanie');
  expect(await page.locator('.tweak-card').count()).toBeGreaterThan(0);
});

test('preview changes need acknowledgement and can be undone', async ({ page }) => {
  await page.getByRole('button', { name: 'Optymalizacja' }).click();
  const first = page.locator('.tweak-card').first();
  const title = await first.getByRole('heading').innerText();
  await first.getByRole('switch').click();
  await page.getByRole('button', { name: 'Przejrzyj zmiany' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(title);
  await expect(dialog).toContainText('Tryb podglądu: to symulacja');
  await expect(dialog.getByRole('button', { name: 'Wypróbuj w podglądzie' })).toBeDisabled();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Wypróbuj w podglądzie' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(first).toContainText('W podglądzie');
  await page.getByRole('button', { name: 'Przywracanie', exact: true }).click();
  await expect(page.locator('.vp-undo-item')).toHaveCount(1);
  await expect(page.locator('.vp-undo-item')).toContainText(title);
  await page.getByRole('checkbox', { name: 'Zaznacz wszystkie' }).check();
  await page.getByRole('button', { name: 'Cofnij wybrane (1)' }).click();
  await expect(page.locator('.vp-undo-item')).toHaveCount(0);
  await expect(page.getByText('Nie zastosowano żadnych modyfikacji.', { exact: false })).toBeVisible();
});

test('Fortnite contains game-specific settings and a closed-game warning', async ({ page }) => {
  await page.getByRole('navigation', { name: 'Nawigacja główna' }).getByRole('button', { name: 'Fortnite' }).click();
  await expect(page.locator('.info-banner')).toContainText('Zamknij Fortnite przed zapisem');
  expect(await page.locator('.tweak-card').count()).toBeGreaterThanOrEqual(16);
  const categoryLabels = page.locator('.tweak-card-bottom > span:first-child');
  for (const text of await categoryLabels.allTextContents()) expect(text).toBe('Fortnite');
});

test('scanner identifies the profile as supplied data instead of a system scan', async ({ page }) => {
  await page.getByRole('button', { name: 'Mój komputer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Twój komputer', exact: true })).toBeVisible();
  await expect(page.locator('.vp-note')).toContainText('profil sprzętowy');
  await page.getByRole('button', { name: 'Skanuj komputer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Rzeczywisty skan sprzętu jest dostępny w aplikacji Windows');
  await expect(page.getByText('Profil docelowy', { exact: true })).toHaveCount(3);
  await expect(page.getByText('Odczyt po skanowaniu', { exact: true })).toBeVisible();
});

test('cleanup preview never invents recoverable disk space', async ({ page }) => {
  await page.getByRole('button', { name: 'Czyszczenie', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wyczyść wybrane', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Skanuj pliki', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Przeglądarka nie ma dostępu do Twojego dysku');
  await expect(page.locator('.vp-clean-hero-copy')).toContainText('Zrób miejsce na grę.');
  await expect(page.locator('.vp-clean-item')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Wyczyść wybrane', exact: true })).toBeDisabled();
  await expect(page.getByText('Tylko stare pliki tymczasowe', { exact: true })).toBeVisible();
});

test('FPS target is a persistent preference rather than a benchmark', async ({ page }) => {
  await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  await page.getByRole('button', { name: /240\s*FPS/ }).click();
  await expect(page.getByRole('button', { name: /240\s*FPS/ })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('.fps-display')).toContainText('240');
  await expect(page.getByText('Twój cel, nie wynik pomiaru')).toBeVisible();
});

test('restore point preview does not claim to create a Windows snapshot', async ({ page }) => {
  await page.getByRole('button', { name: 'Przywracanie', exact: true }).click();
  await page.getByRole('button', { name: 'Utwórz punkt przywracania', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Punkt przywracania utworzysz w aplikacji Windows');
  await expect(page.getByText('0 zapisanych', { exact: true })).toBeVisible();
});

test('mobile navigation reaches the catalog without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Otwórz menu' }).click();
  await page.getByRole('button', { name: 'Optymalizacja' }).click();
  await expect(page.locator('.tweak-card').first()).toBeVisible();
  expect(await page.locator('.tweak-card').count()).toBeGreaterThanOrEqual(50);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('network preview leaves measurements empty and offers seven expandable guides', async ({ page }) => {
  await page.getByRole('button', { name: 'Sieć i input lag', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Opóźnienia i sieć', exact: true })).toBeVisible();
  await expect(page.locator('.vl-disclaimer')).toContainText('Nie mierzy pingu do serwerów Fortnite ani opóźnienia myszy i obrazu');
  await expect(page.locator('.vl-probe-state')).toHaveText(['Nie zmierzono', 'Nie zmierzono']);
  await expect(page.locator('.vl-ping-number > strong')).toHaveText(['—', '—']);
  await page.getByRole('button', { name: 'Zmierz połączenie', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Podgląd przeglądarkowy nie wysyła pakietów i nie tworzy przykładowych wyników');
  await expect(page.locator('.vl-ping-number > strong')).toHaveText(['—', '—']);
  await expect(page.locator('.vl-guide-card')).toHaveCount(7);
  const firstGuide = page.locator('.vl-guide-card').first();
  await expect(firstGuide.locator('.vl-guide-body')).not.toBeVisible();
  await firstGuide.locator('summary').click();
  await expect(firstGuide.locator('.vl-guide-body')).toBeVisible();
  await expect(firstGuide.locator('.vl-guide-body li')).toHaveCount(3);
  await expect(firstGuide).toContainText('NVIDIA Reflex Low Latency');
});
