import { type FormEvent, useId, useState } from 'react';
import { messages } from '../lib/messages';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const [city, setCity] = useState('');
  const trimmedCity = city.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || !trimmedCity) return;
    onSearch(trimmedCity);
  }

  return (
    <form
      role="search"
      aria-label={messages.searchLabel}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        {messages.searchLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="search"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          disabled={disabled}
          placeholder={messages.searchPlaceholder}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-400 bg-night-800 px-4 py-2 text-base text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !trimmedCity}
          className="min-h-11 min-w-11 rounded-xl bg-accent-500 px-5 py-2 font-semibold text-night-900 enabled:hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {messages.searchSubmit}
        </button>
      </div>
    </form>
  );
}
