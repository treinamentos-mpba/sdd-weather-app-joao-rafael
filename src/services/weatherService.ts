import type { City, ForecastDay, WeatherData } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly kind: 'network' | 'timeout' | 'invalid-data' = 'invalid-data',
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }

  get retryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.status === 408 ||
      this.status === 429 ||
      (this.status !== undefined && this.status >= 500 && this.status <= 599)
    );
  }
}

export async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.', undefined, 'timeout');
    }
    if (error instanceof TypeError) {
      throw new WeatherServiceError('Falha de rede.', undefined, 'network');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new WeatherServiceError('Resposta JSON inválida.');
    }
    if (error instanceof TypeError) {
      throw new WeatherServiceError('Falha de rede.', undefined, 'network');
    }
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !value.trim()) {
    throw new WeatherServiceError('Resposta de cidades inválida.');
  }
  return value;
}

function parseCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    Math.abs(value.latitude) > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.longitude) > 180 ||
    (value.id !== undefined &&
      (typeof value.id !== 'number' || !Number.isSafeInteger(value.id) || value.id < 0))
  ) {
    throw new WeatherServiceError('Resposta de cidades inválida.');
  }

  return {
    ...(typeof value.id === 'number' ? { providerId: value.id } : {}),
    name: value.name,
    latitude: value.latitude,
    longitude: value.longitude,
    country: optionalText(value.country),
    region: optionalText(value.admin1),
    timezone: optionalText(value.timezone),
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const response = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`,
  );
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível buscar cidades.', response.status);
  }

  const data = await readJson(response);
  if (!isRecord(data) || (data.results !== undefined && !Array.isArray(data.results))) {
    throw new WeatherServiceError('Resposta de cidades inválida.');
  }
  if (data.results === undefined) return [];

  return data.results.slice(0, 8).map(parseCity);
}

function weatherNumber(value: unknown, min = -Infinity, max = Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new WeatherServiceError('Resposta meteorológica inválida.');
  }
  return value;
}

function validateUnits(value: unknown, expected: Record<string, string>): void {
  if (!isRecord(value) || Object.entries(expected).some(([key, unit]) => value[key] !== unit)) {
    throw new WeatherServiceError('Unidades meteorológicas inválidas.');
  }
}

export async function getWeather(city: City): Promise<WeatherData> {
  weatherNumber(city.latitude, -90, 90);
  weatherNumber(city.longitude, -180, 180);
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,pressure_msl,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '5',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timezone: 'auto',
    timeformat: 'iso8601',
  });
  const response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível carregar a previsão.', response.status);
  }
  const data = await readJson(response);
  if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.daily)) {
    throw new WeatherServiceError('Resposta meteorológica incompleta.');
  }
  if (typeof data.timezone !== 'string' || !data.timezone.trim()) {
    throw new WeatherServiceError('Fuso horário meteorológico inválido.');
  }
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: data.timezone });
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    throw new WeatherServiceError('Fuso horário meteorológico inválido.');
  }
  validateUnits(data.current_units, {
    time: 'iso8601',
    temperature_2m: '°C',
    apparent_temperature: '°C',
    relative_humidity_2m: '%',
    wind_speed_10m: 'km/h',
    precipitation: 'mm',
    pressure_msl: 'hPa',
    weather_code: 'wmo code',
  });
  validateUnits(data.daily_units, {
    time: 'iso8601',
    weather_code: 'wmo code',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C',
    precipitation_probability_max: '%',
  });

  const current = data.current;
  if (
    typeof current.time !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(current.time) ||
    !Number.isFinite(Date.parse(`${current.time}Z`)) ||
    new Date(`${current.time}Z`).toISOString().slice(0, 16) !== current.time.slice(0, 16)
  ) {
    throw new WeatherServiceError('Horário meteorológico inválido.');
  }
  const daily = data.daily;
  function dailyArray(key: string): unknown[] {
    const values = daily[key];
    if (!Array.isArray(values) || values.length !== 5) {
      throw new WeatherServiceError('Previsão diária incompleta.');
    }
    return values;
  }
  const dates = dailyArray('time');
  const maxima = dailyArray('temperature_2m_max');
  const minima = dailyArray('temperature_2m_min');
  const codes = dailyArray('weather_code');
  const probabilities = dailyArray('precipitation_probability_max');
  let previousDate: number | undefined;
  const days: ForecastDay[] = dates.map((date, index) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new WeatherServiceError('Data de previsão inválida.');
    }
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (
      !Number.isFinite(timestamp) ||
      new Date(timestamp).toISOString().slice(0, 10) !== date ||
      (previousDate !== undefined && timestamp !== previousDate + 86_400_000)
    ) {
      throw new WeatherServiceError('Datas da previsão inválidas ou não consecutivas.');
    }
    previousDate = timestamp;
    const temperatureMinC = weatherNumber(minima[index]);
    return {
      date,
      temperatureMinC,
      temperatureMaxC: weatherNumber(maxima[index], temperatureMinC),
      weatherCode: weatherNumber(codes[index]),
      precipitationProbabilityPercent: weatherNumber(probabilities[index], 0, 100),
    };
  });

  return {
    city: { ...city, timezone: data.timezone },
    timezone: data.timezone,
    current: {
      observedAt: current.time,
      temperatureC: weatherNumber(current.temperature_2m),
      apparentTemperatureC: weatherNumber(current.apparent_temperature),
      relativeHumidityPercent: weatherNumber(current.relative_humidity_2m, 0, 100),
      windSpeedKmh: weatherNumber(current.wind_speed_10m, 0),
      precipitationMm: weatherNumber(current.precipitation, 0),
      pressureMslHpa: weatherNumber(current.pressure_msl, Number.MIN_VALUE),
      weatherCode: weatherNumber(current.weather_code),
    },
    days,
  };
}
