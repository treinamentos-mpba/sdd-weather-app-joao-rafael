import { formatForecastDay } from '../lib/format';
import { messages } from '../lib/messages';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const condition = getWeatherCondition(day.weatherCode);

  return (
    <article
      aria-label={formatForecastDay(day.date)}
      className="h-full break-words rounded-2xl border border-white/10 bg-white/5 p-3 font-sans text-white shadow-glass backdrop-blur-md sm:p-4"
    >
      <h3 className="font-semibold">
        <time dateTime={day.date}>{formatForecastDay(day.date)}</time>
      </h3>
      <span aria-hidden="true" className="my-3 block text-4xl text-sun">
        {condition.icon}
      </span>
      <p className="text-sm text-slate-300">{condition.label}</p>
      <dl className="mt-4 space-y-2">
        <div>
          <dt className="text-sm text-slate-300">{messages.maximum}</dt>
          <dd className="text-xl font-semibold">{formatTemperature(day.temperatureMaxC, unit)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-300">{messages.minimum}</dt>
          <dd>{formatTemperature(day.temperatureMinC, unit)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-300">{messages.rainProbability}</dt>
          <dd>
            {day.precipitationProbabilityPercent === null
              ? messages.unavailableValue
              : `${day.precipitationProbabilityPercent.toLocaleString('pt-BR')} %`}
          </dd>
        </div>
      </dl>
    </article>
  );
}
