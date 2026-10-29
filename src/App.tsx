import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import { messages } from './lib/messages';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const mainRef = useRef<HTMLElement>(null);
  const { status, data, error, search, retry } = useWeather();

  useEffect(() => {
    if (status === 'success') mainRef.current?.focus();
  }, [status]);

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
        </header>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          aria-busy={status === 'loading'}
          className="min-w-0 space-y-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState title={messages.welcomeTitle} hint={messages.welcomeHint} />
          )}
          {status === 'loading' && <LoadingState />}
          {status === 'empty' && <EmptyState />}
          {status === 'error' && error && (
            <ErrorState
              message={error.message}
              onRetry={
                error.retryable
                  ? () => {
                      retry();
                      mainRef.current?.focus();
                    }
                  : undefined
              }
            />
          )}
          {status === 'success' && data && (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList days={data.days} unit={unit} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
