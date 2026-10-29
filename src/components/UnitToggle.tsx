import { messages } from '../lib/messages';
import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label={messages.unitGroupLabel}
      className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 font-sans shadow-glass backdrop-blur-md"
    >
      {(['celsius', 'fahrenheit'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={unit === option}
          onClick={() => onChange(option)}
          className={`min-h-11 min-w-11 rounded-lg px-3 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
            unit === option ? 'bg-accent-500 text-night-900' : 'text-white hover:bg-white/10'
          }`}
        >
          {messages[option]}
        </button>
      ))}
    </div>
  );
}
