import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useMockWeather, { type DemoStatus } from './hooks/useMockWeather';
import { messages } from './lib/messages';
import mockWeatherData from './mocks/weatherData';
import type { Unit } from './types/weather';

const demoStatuses: DemoStatus[] = ['idle', 'loading', 'empty', 'error', 'success'];

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const mainRef = useRef<HTMLElement>(null);
  const { status, search, preview, retry } = useMockWeather();

  return (
    <div className="min-h-screen bg-night-900 font-sans text-white">
      <a
        href="#main-content"
        className="sr-only z-10 rounded bg-accent-400 p-3 text-night-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {messages.skipToContent}
      </a>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">{messages.brand}</h1>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          <SearchBar onSearch={search} />
          <p className="text-sm text-slate-300">{messages.demoNotice}</p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="demo-state" className="text-sm">
              {messages.demoState}
            </label>
            <select
              id="demo-state"
              value={status}
              onChange={(event) => {
                const selected = demoStatuses.find((value) => value === event.target.value);
                if (selected) preview(selected);
              }}
              className="min-h-11 rounded-lg border border-slate-400 bg-night-800 px-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              {demoStatuses.map((value) => (
                <option key={value} value={value}>
                  {messages[value]}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="min-w-0 space-y-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState title={messages.welcomeTitle} hint={messages.welcomeHint} />
          )}
          {status === 'loading' && <LoadingState />}
          {status === 'empty' && <EmptyState />}
          {status === 'error' && (
            <ErrorState
              message={messages.demoError}
              onRetry={() => {
                retry();
                mainRef.current?.focus();
              }}
            />
          )}
          {status === 'success' && (
            <>
              <CurrentWeather
                city={mockWeatherData.city}
                current={mockWeatherData.current}
                unit={unit}
              />
              <ForecastList days={mockWeatherData.days} unit={unit} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
