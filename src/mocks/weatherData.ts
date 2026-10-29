import type { WeatherData } from '../types/weather';

const mockWeatherData: WeatherData = {
  city: {
    name: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    country: 'Brasil',
    region: 'São Paulo',
    timezone: 'America/Sao_Paulo',
  },
  timezone: 'America/Sao_Paulo',
  current: {
    observedAt: '2026-10-29T14:00:00-03:00',
    temperatureC: 26.4,
    apparentTemperatureC: 27.1,
    relativeHumidityPercent: 68,
    windSpeedKmh: 12.6,
    precipitationMm: 0.2,
    pressureMslHpa: 1013.2,
    weatherCode: 2,
  },
  days: [
    {
      date: '2026-10-29',
      temperatureMaxC: 29.1,
      temperatureMinC: 21.8,
      precipitationProbabilityPercent: 20,
      weatherCode: 2,
    },
    {
      date: '2026-10-30',
      temperatureMaxC: 28.7,
      temperatureMinC: 21.5,
      precipitationProbabilityPercent: 35,
      weatherCode: 3,
    },
    {
      date: '2026-10-31',
      temperatureMaxC: 26.4,
      temperatureMinC: 20.9,
      precipitationProbabilityPercent: 80,
      weatherCode: 61,
    },
    {
      date: '2026-11-01',
      temperatureMaxC: 29,
      temperatureMinC: 21.2,
      precipitationProbabilityPercent: 10,
      weatherCode: 1,
    },
    {
      date: '2026-11-02',
      temperatureMaxC: 30.2,
      temperatureMinC: 22.1,
      precipitationProbabilityPercent: 0,
      weatherCode: 0,
    },
  ],
};

export default mockWeatherData;
