import { describe, expect, it } from 'vitest';
import {
  formatForecastDay,
  formatObservedAt,
  getDayLabel,
  getShortDate,
} from '../../src/lib/format';

describe('getDayLabel', () => {
  it.each([
    ['2026-10-29', 0, 'Hoje'],
    ['2026-10-30', 1, 'Amanhã'],
    ['2026-10-31', 2, 'sáb.'],
    ['2026-11-01', 3, 'dom.'],
    ['2026-11-02', 4, 'seg.'],
    ['2027-01-01', 2, 'sex.'],
  ])('rotula %s no índice %s como %s', (date, index, expected) => {
    expect(getDayLabel(date, index)).toBe(expected);
  });
});

describe('getShortDate', () => {
  it.each([
    ['2026-10-29', '29/10'],
    ['2026-11-01', '01/11'],
    ['2027-01-01', '01/01'],
    ['2028-02-29', '29/02'],
  ])('formata %s como %s sem deslocamento pelo fuso local', (date, expected) => {
    expect(getShortDate(date)).toBe(expected);
  });
});

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
  it('respeita a virada de ano no fuso de Tóquio, não no fuso do usuário', () => {
    expect(formatObservedAt('2026-12-31T22:00:00Z', 'Asia/Tokyo')).toBe('01/01/2027, 07:00');
    expect(formatObservedAt('2026-12-31T22:00:00Z', 'America/Sao_Paulo')).toBe('31/12/2026, 19:00');
  });

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
