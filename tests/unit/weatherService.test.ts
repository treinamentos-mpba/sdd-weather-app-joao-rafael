import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => vi.unstubAllGlobals());

const city = {
  id: 3450554,
  name: 'Salvador',
  latitude: -12.97111,
  longitude: -38.51083,
  country: 'Brasil',
  admin1: 'Bahia',
  timezone: 'America/Bahia',
};

function mockResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('retorna vazio sem rede para %j', async (name) => {
    const fetchMock = mockResponse({});
    expect(await searchCities(name)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome trimado e mapeia os campos da Open-Meteo', async () => {
    const fetchMock = mockResponse({ results: [city] });
    expect(await searchCities('  São Paulo & região  ')).toEqual([
      {
        providerId: city.id,
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        country: 'Brasil',
        region: 'Bahia',
        timezone: 'America/Bahia',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o&count=8&language=pt&format=json',
      { signal: expect.any(AbortSignal) },
    );
  });

  it.each([{}, { results: [] }])('trata ausência de resultados como vazio: %j', async (body) => {
    mockResponse(body);
    expect(await searchCities('Salvador')).toEqual([]);
  });

  it('preserva ordem, limita a oito e normaliza campos opcionais ausentes', async () => {
    mockResponse({
      results: Array.from({ length: 10 }, (_, index) => ({
        name: `Cidade ${index}`,
        latitude: 0,
        longitude: 0,
      })),
    });
    const cities = await searchCities('Cidade');
    expect(cities).toHaveLength(8);
    expect(cities.map((result) => result.name)).toEqual(
      Array.from({ length: 8 }, (_, index) => `Cidade ${index}`),
    );
    expect(cities[0]).toEqual({
      name: 'Cidade 0',
      latitude: 0,
      longitude: 0,
      country: null,
      region: null,
      timezone: null,
    });
  });

  it.each([
    400, 404, 408, 429, 500,
  ])('lança erro tipado para HTTP %s, sem retry', async (status) => {
    const fetchMock = mockResponse({}, status);
    const error = await searchCities('Salvador').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ name: 'WeatherServiceError', status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    null,
    { results: null },
    { results: {} },
    { results: [{ ...city, latitude: 91 }] },
    { results: [{ ...city, longitude: -181 }] },
    { results: [{ ...city, name: '' }] },
    { results: [{ ...city, country: 42 }] },
    { results: [{ ...city, id: '123' }] },
  ])('rejeita payload inválido em vez de mascarar como vazio: %j', async (body) => {
    mockResponse(body);
    await expect(searchCities('Salvador')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('propaga falha de rede sem repetir a chamada', async () => {
    const error = new TypeError('Failed to fetch');
    const fetchMock = vi.fn().mockRejectedValue(error);
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchCities('Salvador')).rejects.toBe(error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propaga JSON inválido em vez de retornar lista vazia', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
    await expect(searchCities('Salvador')).rejects.toBeInstanceOf(SyntaxError);
  });
});
