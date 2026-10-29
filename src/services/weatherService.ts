import type { City } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
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

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`,
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível buscar cidades.', response.status);
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || (data.results !== undefined && !Array.isArray(data.results))) {
    throw new WeatherServiceError('Resposta de cidades inválida.');
  }
  if (data.results === undefined) return [];

  return data.results.slice(0, 8).map(parseCity);
}
