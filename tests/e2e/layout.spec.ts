import { expect, test } from '@playwright/test';
import mockWeatherData from '../../src/mocks/weatherData';

test.beforeEach(async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const name = new URL(route.request().url()).searchParams.get('name');
    await route.fulfill({
      json: {
        results:
          name === 'Vazio'
            ? []
            : [
                {
                  name: mockWeatherData.city.name,
                  latitude: mockWeatherData.city.latitude,
                  longitude: mockWeatherData.city.longitude,
                  country: 'Brasil',
                  admin1: 'São Paulo',
                  timezone: 'America/Sao_Paulo',
                },
              ],
      },
    });
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    const { current, days, timezone } = mockWeatherData;
    await route.fulfill({
      json: {
        timezone,
        current_units: {
          time: 'iso8601',
          temperature_2m: '°C',
          apparent_temperature: '°C',
          relative_humidity_2m: '%',
          wind_speed_10m: 'km/h',
          precipitation: 'mm',
          pressure_msl: 'hPa',
          weather_code: 'wmo code',
        },
        daily_units: {
          time: 'iso8601',
          temperature_2m_max: '°C',
          temperature_2m_min: '°C',
          weather_code: 'wmo code',
          precipitation_probability_max: '%',
        },
        current: {
          time: '2026-10-29T14:00',
          temperature_2m: current.temperatureC,
          apparent_temperature: current.apparentTemperatureC,
          relative_humidity_2m: current.relativeHumidityPercent,
          wind_speed_10m: current.windSpeedKmh,
          precipitation: current.precipitationMm,
          pressure_msl: current.pressureMslHpa,
          weather_code: current.weatherCode,
        },
        daily: {
          time: days.map((day) => day.date),
          temperature_2m_max: days.map((day) => day.temperatureMaxC),
          temperature_2m_min: days.map((day) => day.temperatureMinC),
          weather_code: days.map((day) => day.weatherCode),
          precipitation_probability_max: days.map((day) => day.precipitationProbabilityPercent),
        },
      },
    });
  });
});

test('exibe vazio sem forecast e recupera falha transitória com retry', async ({ page }) => {
  let forecastRequests = 0;
  page.on('request', (request) => {
    if (request.url().startsWith('https://api.open-meteo.com/')) forecastRequests += 1;
  });
  await page.goto('/');
  await page.getByRole('searchbox').fill('Vazio');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  expect(forecastRequests).toBe(0);

  await page.route(
    'https://api.open-meteo.com/**',
    (route) => route.fulfill({ status: 503, json: {} }),
    { times: 1 },
  );
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Não foi possível carregar a previsão.');
  expect(forecastRequests).toBe(1);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  expect(forecastRequests).toBe(2);
  await page.getByRole('button', { name: '°F' }).click();
  expect(forecastRequests).toBe(2);
});

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
  await page.route('https://geocoding-api.open-meteo.com/**', () => {});
  await button.click();
  const spinner = page.getByRole('status').locator('[aria-hidden]');
  expect(await spinner.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
});

for (const width of [320, 360, 768, 1280]) {
  test(`layout sem overflow e com controles acessíveis em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Como está o tempo?' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();

    await page.getByRole('searchbox').fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
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

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    for (const control of await page.getByRole('button').all()) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
}
