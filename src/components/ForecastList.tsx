import { useId } from 'react';
import { messages } from '../lib/messages';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  days: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  const headingId = useId();
  const firstDate = Date.parse(`${days[0]?.date}T00:00:00Z`);
  const isValid =
    days.length === 5 &&
    days.every((day, index) => {
      const timestamp = Date.parse(`${day.date}T00:00:00Z`);
      return (
        /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
        Number.isFinite(timestamp) &&
        new Date(timestamp).toISOString().slice(0, 10) === day.date &&
        timestamp === firstDate + index * 86_400_000 &&
        [day.temperatureMaxC, day.temperatureMinC, day.weatherCode].every(Number.isFinite) &&
        day.temperatureMaxC >= day.temperatureMinC &&
        (day.precipitationProbabilityPercent === null ||
          (Number.isFinite(day.precipitationProbabilityPercent) &&
            day.precipitationProbabilityPercent >= 0 &&
            day.precipitationProbabilityPercent <= 100))
      );
    });

  return (
    <section aria-labelledby={headingId} className="font-sans text-white">
      <h2 id={headingId} className="mb-4 text-xl font-semibold">
        {messages.forecastTitle}
      </h2>
      {days.length === 0 ? (
        <p role="status">{messages.emptyForecast}</p>
      ) : !isValid ? (
        <p role="alert">{messages.invalidForecast}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {days.map((day) => (
            <li key={day.date} className="min-w-0">
              <ForecastCard day={day} unit={unit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
