import mockWeatherData from '../../src/mocks/weatherData';

export const geocodingResponse = {
  results: [
    {
      id: 3448439,
      name: 'São Paulo',
      latitude: -23.5505,
      longitude: -46.6333,
      country: 'Brasil',
      admin1: 'São Paulo',
      timezone: 'America/Sao_Paulo',
    },
  ],
};

export function forecastResponse() {
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
  };
}
