export function formatForecastDay(date: string): string {
  // Datas diárias já são locais à cidade; UTC evita deslocá-las pelo fuso do navegador.
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatObservedAt(observedAt: string, timezone: string | null): string {
  if (!timezone) return observedAt;
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(observedAt);
  // Sem offset, a Open-Meteo já fornece o horário local da cidade.
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: hasOffset ? timezone : 'UTC',
  }).format(new Date(hasOffset ? observedAt : `${observedAt}Z`));
}
