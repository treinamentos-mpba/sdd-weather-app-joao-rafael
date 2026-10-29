import { describe, expect, it } from 'vitest';
import { formatForecastDay, formatObservedAt } from '../../src/lib/format';

describe('formatForecastDay', () => {
  it.each([
    ['2026-10-29', 'qui., 29/10'],
    ['2026-10-31', 'sáb., 31/10'],
    ['2026-11-01', 'dom., 01/11'],
  ])('formata a data local %s sem deslocamento de fuso', (date, label) => {
    expect(formatForecastDay(date)).toBe(label);
  });
});

describe('formatObservedAt', () => {
  it('converte um instante UTC para o fuso da cidade', () => {
    expect(formatObservedAt('2026-10-29T17:00:00Z', 'America/Sao_Paulo')).toBe('29/10/2026, 14:00');
  });

  it('preserva o horário local sem offset da Open-Meteo', () => {
    expect(formatObservedAt('2026-10-29T14:00', 'America/Sao_Paulo')).toBe('29/10/2026, 14:00');
  });

  it('não inventa fuso quando ele não está disponível', () => {
    expect(formatObservedAt('2026-10-29T14:00', null)).toBe('2026-10-29T14:00');
  });
});
