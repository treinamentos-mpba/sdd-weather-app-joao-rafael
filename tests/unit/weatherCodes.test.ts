import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('getWeatherCondition', () => {
  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('mapeia o código WMO %s para texto e ícone', (code) => {
    const condition = getWeatherCondition(code);
    expect(condition.label).not.toBe('Condição meteorológica indisponível');
    expect(condition.label).not.toBe('');
    expect(condition.icon).not.toBe('');
  });

  it('mapeia códigos representativos para a condição correspondente', () => {
    expect(getWeatherCondition(0)).toEqual({ label: 'Céu limpo', icon: '☀️' });
    expect(getWeatherCondition(61)).toEqual({ label: 'Chuva leve', icon: '🌧️' });
    expect(getWeatherCondition(95)).toEqual({ label: 'Trovoada', icon: '⛈️' });
  });

  it('usa fallback neutro para código desconhecido', () => {
    expect(getWeatherCondition(999)).toEqual({
      label: 'Condição meteorológica indisponível',
      icon: '◇',
    });
  });
});
