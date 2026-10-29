import { expect, type Page, test } from '@playwright/test';
import { forecastResponse, geocodingResponse } from '../fixtures/weatherApi';

const geocodingUrl = 'https://geocoding-api.open-meteo.com/**';
const forecastUrl = 'https://api.open-meteo.com/**';

async function search(page: Page, name = 'São Paulo') {
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill(name);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.route(geocodingUrl, (route) => route.fulfill({ json: geocodingResponse }));
  await page.route(forecastUrl, (route) => route.fulfill({ json: forecastResponse() }));
});

test('loading sinaliza conteúdo ocupado e sucesso recebe foco sem afetar unidade', async ({
  page,
}) => {
  let releaseForecast: () => void = () => {
    throw new Error('Forecast não inicializado');
  };
  const pendingForecast = new Promise<void>((resolve) => {
    releaseForecast = resolve;
  });
  await page.route(forecastUrl, async (route) => {
    await pendingForecast;
    await route.fulfill({ json: forecastResponse() });
  });
  await page.goto('/');
  await search(page);
  const main = page.getByRole('main');
  await expect(main).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('status')).toHaveText('Carregando previsão do tempo…');
  await expect(page.getByRole('searchbox')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  releaseForecast();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  await expect(main).toHaveAttribute('aria-busy', 'false');
  await expect(main).toBeFocused();
  const fahrenheit = page.getByRole('button', { name: '°F' });
  await fahrenheit.focus();
  await fahrenheit.press('Enter');
  await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  await expect(fahrenheit).toBeFocused();
});

for (const name of ['', '   ']) {
  test(`busca vazia após trim ${JSON.stringify(name)} não dispara rede nem altera boas-vindas`, async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('open-meteo.com/')) requests.push(request.url());
    });
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill(name);
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeDisabled();
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('heading', { name: 'Como está o tempo?' })).toBeVisible();
    await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(requests).toEqual([]);
  });
}

test('caracteres especiais são enviados e exibidos literalmente, sem interpretar HTML', async ({
  page,
}) => {
  const name = 'São Tomé & Príncipe <img src=x onerror=alert(1)>';
  await page.route(geocodingUrl, (route) =>
    route.fulfill({
      json: { results: [{ ...geocodingResponse.results[0], name }] },
    }),
  );
  await page.goto('/');
  const request = page.waitForRequest((request) =>
    request.url().startsWith('https://geocoding-api.open-meteo.com/'),
  );
  await search(page, `  ${name}  `);
  const url = new URL((await request).url());
  expect(url.searchParams.get('name')).toBe(name);
  expect([...url.searchParams.keys()]).toEqual(['name', 'count', 'language', 'format']);
  await expect(
    page.getByRole('region', { name, exact: true }).getByRole('heading', { name, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByRole('img')).toHaveCount(0);
  await expect(page.getByRole('main')).toBeFocused();
});

test('métricas null aparecem como traços e precipitação null como zero', async ({ page }) => {
  const data = forecastResponse();
  await page.route(forecastUrl, (route) =>
    route.fulfill({
      json: {
        ...data,
        current: {
          ...data.current,
          apparent_temperature: null,
          relative_humidity_2m: null,
          wind_speed_10m: null,
          pressure_msl: null,
          precipitation: null,
        },
        daily: { ...data.daily, precipitation_probability_max: [null, 0, null, 10, 0] },
      },
    }),
  );
  await page.goto('/');
  await search(page);
  const weather = page.getByRole('region', { name: 'São Paulo' });
  await expect(weather.getByText('Sensação térmica: —', { exact: true })).toBeVisible();
  await expect(weather.getByText('—', { exact: true })).toHaveCount(3);
  await expect(weather.getByText('0 mm', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).click();
  await expect(weather.getByText('80 °F', { exact: true })).toBeVisible();
  await expect(weather.getByText('Sensação térmica: —', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Previsão de 5 dias' }).getByText('—', { exact: true }),
  ).toHaveCount(2);
  await expect(page.getByRole('main')).not.toContainText(/NaN|undefined|null/);
});

test('offline no geocoding mostra mensagem e retry repete a busca após reconexão', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('searchbox', { name: 'Buscar cidade' })).toBeVisible();
  // Rotas mockadas respondem mesmo offline; liberar a primeira chamada exercita o navegador.
  await page.route(geocodingUrl, (route) => route.continue(), { times: 1 });
  await context.setOffline(true);
  try {
    await search(page);
    await expect(page.getByRole('alert')).toHaveText('Falha de rede.');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
  } finally {
    await context.setOffline(false);
  }
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
});
test('busca cidade, mostra previsão e converte todas as temperaturas sem nova rede', async ({
  page,
}) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().includes('open-meteo.com/')) requests += 1;
  });
  const response = forecastResponse();
  response.current.temperature_2m = 0;
  response.current.apparent_temperature = -2.5;
  response.daily.temperature_2m_max = [0, 100, -40, 26.4, 2.5];
  response.daily.temperature_2m_min = [-2.5, 0, -40, -0.1, 0];
  await page.route(forecastUrl, (route) => route.fulfill({ json: response }));
  await page.goto('/');
  await search(page);
  const weather = page.getByRole('region', { name: 'São Paulo' });
  await expect(weather.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
  await expect(weather.getByText('0 °C', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(forecast.getByRole('article')).toHaveCount(5);
  expect(requests).toBe(2);
  await page.getByRole('button', { name: '°F' }).click();
  await expect(weather.getByText('32 °F', { exact: true })).toBeVisible();
  await expect(weather.getByText('Sensação térmica: 28 °F', { exact: true })).toBeVisible();
  const cards = forecast.getByRole('article');
  for (const [index, [maximum, minimum]] of [
    ['32 °F', '28 °F'],
    ['212 °F', '32 °F'],
    ['-40 °F', '-40 °F'],
    ['80 °F', '32 °F'],
    ['37 °F', '32 °F'],
  ].entries()) {
    await expect(cards.nth(index).getByRole('definition').nth(0)).toHaveText(maximum);
    await expect(cards.nth(index).getByRole('definition').nth(1)).toHaveText(minimum);
  }
  await expect(weather.getByText('12,6 km/h', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°C' }).click();
  await expect(weather.getByText('0 °C', { exact: true })).toBeVisible();
  expect(requests).toBe(2);
});

for (const body of [{}, { results: [] }]) {
  test(`geocoding sem resultados ${JSON.stringify(body)} mostra vazio sem chamar forecast`, async ({
    page,
  }) => {
    let forecasts = 0;
    page.on('request', (request) => {
      if (request.url().startsWith('https://api.open-meteo.com/')) forecasts += 1;
    });
    await page.route(geocodingUrl, (route) => route.fulfill({ json: body }));
    await page.goto('/');
    await search(page, 'Inexistente');
    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    await expect(
      page.getByText('Verifique a grafia ou tente outra busca.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    expect(forecasts).toBe(0);
  });
}

test('fluxo principal em mobile 375x812 mantém clima e seleção após rotação', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await search(page);
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).click();
  const temperature = page
    .getByRole('region', { name: 'São Paulo' })
    .getByText('80 °F', { exact: true });
  await expect(temperature).toBeVisible();
  await page.setViewportSize({ width: 812, height: 375 });
  await expect(temperature).toBeVisible();
  await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const missing of ['current', 'daily']) {
  test(`resposta parcial sem ${missing} remove dados anteriores e mostra erro sem retry`, async ({
    page,
  }) => {
    await page.goto('/');
    await search(page);
    await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
    const partial: Record<string, unknown> = forecastResponse();
    delete partial[missing];
    await page.route(forecastUrl, (route) => route.fulfill({ json: partial }));
    await search(page);
    await expect(page.getByRole('alert')).toHaveText('Resposta meteorológica incompleta.');
    await expect(page.getByRole('region', { name: 'São Paulo' })).toHaveCount(0);
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('main')).not.toContainText(/NaN|undefined/);
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);
  });
}

test('forecast com array truncado não renderiza previsão parcial', async ({ page }) => {
  const partial = forecastResponse();
  partial.daily.temperature_2m_max.pop();
  await page.route(forecastUrl, (route) => route.fulfill({ json: partial }));
  await page.goto('/');
  await search(page);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'São Paulo' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('main')).not.toContainText(/NaN|undefined/);
});

for (const status of [400, 401, 403, 404]) {
  test(`HTTP ${status} mostra erro permanente sem retry`, async ({ page }) => {
    await page.route(forecastUrl, (route) => route.fulfill({ status, json: {} }));
    await page.goto('/');
    await search(page);
    await expect(page.getByRole('alert')).toHaveText('Não foi possível carregar a previsão.');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);
  });
}

test('falha de rede permite retry manual sem repetir geocoding', async ({ page }) => {
  let geocodingRequests = 0;
  page.on('request', (request) => {
    if (request.url().startsWith('https://geocoding-api.open-meteo.com/')) geocodingRequests += 1;
  });
  await page.route(forecastUrl, (route) => route.abort('failed'), { times: 1 });
  await page.goto('/');
  await search(page);
  await expect(page.getByRole('alert')).toHaveText('Falha de rede.');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  expect(geocodingRequests).toBe(1);
});

test('timeout de 10s usa relógio controlado em vez de espera real', async ({ page }) => {
  await page.clock.install();
  await page.route(forecastUrl, () => {});
  await page.goto('/');
  const requested = page.waitForRequest((request) =>
    request.url().startsWith('https://api.open-meteo.com/'),
  );
  await search(page);
  await requested;
  await page.clock.fastForward(10_000);
  await expect(page.getByRole('alert')).toHaveText('A requisição demorou demais.');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});
