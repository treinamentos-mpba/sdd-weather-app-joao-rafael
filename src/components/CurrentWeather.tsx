import { useEffect, useId } from 'react';
import { formatObservedAt } from '../lib/format';
import { messages } from '../lib/messages';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode);
  useEffect(() => {
    if (import.meta.env.DEV && condition.label === messages.unavailableCondition) {
      console.warn('Código meteorológico desconhecido:', current.weatherCode);
    }
  }, [condition.label, current.weatherCode]);

  const numericValues = [
    current.temperatureC,
    current.apparentTemperatureC,
    current.relativeHumidityPercent,
    current.windSpeedKmh,
    current.precipitationMm,
    current.pressureMslHpa,
    current.weatherCode,
  ];
  if (
    !numericValues.every(Number.isFinite) ||
    current.relativeHumidityPercent < 0 ||
    current.relativeHumidityPercent > 100 ||
    current.windSpeedKmh < 0 ||
    current.precipitationMm < 0 ||
    current.pressureMslHpa <= 0
  ) {
    return <p role="alert">{messages.invalidWeather}</p>;
  }

  const location = [city.region, city.country].filter(Boolean).join(', ');
  const metrics = [
    [messages.humidity, `${numberFormat.format(current.relativeHumidityPercent)} %`],
    [messages.wind, `${numberFormat.format(current.windSpeedKmh)} km/h`],
    [messages.precipitation, `${numberFormat.format(current.precipitationMm)} mm`],
    [messages.pressure, `${numberFormat.format(current.pressureMslHpa)} hPa`],
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <p className="text-sm text-slate-300">{messages.currentWeather}</p>
      <h2 id={headingId} className="break-words text-2xl font-semibold">
        {city.name}
      </h2>
      <p className="break-words text-slate-300">
        {location ||
          `${city.latitude.toFixed(2).replace('.', ',')}, ${city.longitude.toFixed(2).replace('.', ',')}`}
      </p>
      <div className="my-6 flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="text-6xl text-sun">
          {condition.icon}
        </span>
        <p className="max-w-full break-words text-5xl font-semibold tracking-tight sm:text-8xl">
          {formatTemperature(current.temperatureC, unit)}
        </p>
      </div>
      <p className="text-xl">{condition.label}</p>
      <p className="mt-1 text-slate-300">
        {messages.feelsLike}: {formatTemperature(current.apparentTemperatureC, unit)}
      </p>
      <p className="mt-2 break-words text-sm text-slate-300">
        {messages.dataReference}:{' '}
        <time dateTime={current.observedAt}>
          {formatObservedAt(current.observedAt, city.timezone)}
        </time>
        {city.timezone && ` (${city.timezone})`}
      </p>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className="mt-1 text-xl font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
