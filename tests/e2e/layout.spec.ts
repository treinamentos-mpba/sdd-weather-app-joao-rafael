import { expect, test } from '@playwright/test';

test('contraste de controles, foco e movimento reduzido', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('São Paulo');
  const search = page.getByRole('searchbox');
  const button = page.getByRole('button', { name: 'Buscar', exact: true });
  const contrast = (foreground: string, background: string) => {
    const luminance = (color: string) => {
      const channels = color
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      if (channels?.length !== 3) throw new Error(`Cor inválida: ${color}`);
      const linear = channels.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  for (const control of [search, button]) {
    const colors = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      return { text: style.color, background: style.backgroundColor, border: style.borderTopColor };
    });
    expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
    if (control === search) {
      expect(contrast(colors.border, colors.background)).toBeGreaterThanOrEqual(3);
    }
  }
  await search.focus();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  expect(await button.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('2px');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Estado da demonstração').selectOption('loading');
  const spinner = page.getByRole('status').locator('[aria-hidden]');
  expect(await spinner.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
});

for (const width of [320, 360, 768, 1280]) {
  test(`layout sem overflow e com controles acessíveis em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();

    await page.getByLabel('Estado da demonstração').selectOption('success');
    await expect(page.getByRole('article')).toHaveCount(5);
    await page.getByRole('button', { name: '°F' }).click();
    await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('region', { name: 'São Paulo' }).getByText('80 °F', { exact: true }),
    ).toBeVisible();
    const columns = await page
      .getByRole('list')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 1024 ? 5 : width >= 640 ? 3 : 2);

    for (const state of ['idle', 'loading', 'empty', 'error', 'success']) {
      await page.getByLabel('Estado da demonstração').selectOption(state);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    }
    for (const control of await page.getByRole('button').all()) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
}
