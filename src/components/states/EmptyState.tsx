import { useId } from 'react';
import { messages } from '../../lib/messages';

interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = messages.emptyTitle,
  hint = messages.emptyHint,
}: EmptyStateProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-md"
    >
      <h2 id={headingId} className="break-words text-xl font-semibold">
        {title}
      </h2>
      <p role="status" className="mt-2 break-words text-slate-300">
        {hint}
      </p>
    </section>
  );
}
