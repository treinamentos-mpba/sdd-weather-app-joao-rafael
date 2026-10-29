import { afterEach, describe, expect, it, vi } from 'vitest';
import mockWeatherData from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

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
  it.each([
    [400, false],
    [404, false],
    [408, true],
    [429, true],
    [500, true],
    [503, true],
    [418, false],
  ])('classifica retry para HTTP %s como %s', (status, retryable) => {
    expect(new WeatherServiceError('Erro HTTP', status).retryable).toBe(retryable);
  });

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
    await expect(searchCities('Salvador')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  function forecastResponse() {
    const { current, days, timezone } = mockWeatherData;
    return {
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
        weather_code: 'wmo code',
        temperature_2m_max: '°C',
        temperature_2m_min: '°C',
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
    };
  }

  describe('getWeather', () => {
    it('solicita os campos e unidades definidos e mapeia todos os índices diários', async () => {
      const fetchMock = mockResponse(forecastResponse());
      const inputCity = { ...mockWeatherData.city, timezone: null };
      const result = await getWeather(inputCity);
      expect(result).toEqual({
        ...mockWeatherData,
        current: { ...mockWeatherData.current, observedAt: '2026-10-29T14:00' },
      });
      expect(inputCity.timezone).toBeNull();
      const url = new URL(fetchMock.mock.calls[0][0]);
      expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
      expect(Object.fromEntries(url.searchParams)).toMatchObject({
        latitude: '-23.5505',
        longitude: '-46.6333',
        forecast_days: '5',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
        precipitation_unit: 'mm',
        timezone: 'auto',
        timeformat: 'iso8601',
        current:
          'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each(['current', 'daily'])('rejeita resposta sem %s', async (field) => {
      const response: Record<string, unknown> = forecastResponse();
      delete response[field];
      mockResponse(response);
      await expect(getWeather(mockWeatherData.city)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it.each([
      (data: ReturnType<typeof forecastResponse>) => {
        data.daily.time.pop();
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.daily.temperature_2m_max.pop();
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.daily.time[1] = data.daily.time[0];
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.daily.time[1] = '2026-02-30';
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.daily.precipitation_probability_max[0] = 101;
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.daily.temperature_2m_min[0] = 100;
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.current.temperature_2m = Number.NaN;
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.current.relative_humidity_2m = -1;
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.current.time = '2026-02-30T14:00';
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.timezone = 'Invalid/Timezone';
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.current_units.temperature_2m = '°F';
      },
      (data: ReturnType<typeof forecastResponse>) => {
        data.daily_units.precipitation_probability_max = 'mm';
      },
    ])('rejeita dados inválidos sem snapshot parcial (%#)', async (mutate) => {
      const data = forecastResponse();
      mutate(data);
      mockResponse(data);
      await expect(getWeather(mockWeatherData.city)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('lança erro tipado com status para resposta não-ok', async () => {
      const fetchMock = mockResponse({}, 503);
      await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        status: 503,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejeita coordenadas inválidas antes da rede', async () => {
      const fetchMock = mockResponse({});
      await expect(getWeather({ ...mockWeatherData.city, latitude: 91 })).rejects.toBeInstanceOf(
        WeatherServiceError,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('propaga JSON inválido em vez de retornar lista vazia', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
    await expect(searchCities('Salvador')).rejects.toBeInstanceOf(WeatherServiceError);
  });
});
