import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  toDisplayTemperature,
  unitLabel,
} from '../../src/lib/temperature';
import type { Unit } from '../../src/types/weather';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F', (valueC, expected) => {
    expect(convertTemperature(valueC, 'fahrenheit')).toBe(expected);
  });

  it.each([0, 100, -40, 26.4])('preserva %s quando a unidade é Celsius', (valueC) => {
    expect(convertTemperature(valueC, 'celsius')).toBe(valueC);
  });

  it('mantém a precisão antes da formatação', () => {
    expect(convertTemperature(26.4, 'fahrenheit')).toBeCloseTo(79.52);
  });
});

describe('unitLabel', () => {
  it.each<[Unit, string]>([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ])('retorna o símbolo de %s', (unit, expected) => {
    expect(unitLabel(unit)).toBe(expected);
  });
});

describe('formatTemperature', () => {
  it.each<[number, Unit, string]>([
    [0, 'fahrenheit', '32 °F'],
    [100, 'fahrenheit', '212 °F'],
    [-40, 'fahrenheit', '-40 °F'],
    [26.4, 'fahrenheit', '80 °F'],
    [26.4, 'celsius', '26 °C'],
    [2.5, 'celsius', '3 °C'],
    [-2.5, 'celsius', '-3 °C'],
    [-0.1, 'celsius', '0 °C'],
    [0, 'celsius', '0 °C'],
    [1234.4, 'celsius', '1.234 °C'],
  ])('formata %s °C na unidade %s como %s', (valueC, unit, expected) => {
    expect(formatTemperature(valueC, unit)).toBe(expected);
  });
});

describe('toDisplayTemperature', () => {
  it.each<[number, Unit, number]>([
    [0, 'fahrenheit', 32],
    [100, 'fahrenheit', 212],
    [-40, 'fahrenheit', -40],
    [26.4, 'fahrenheit', 80],
    [2.5, 'celsius', 3],
    [-2.5, 'celsius', -3],
    [-0.1, 'celsius', 0],
    [26.4, 'celsius', 26],
  ])('converte %s °C em %s e arredonda para %s', (value, unit, expected) => {
    expect(toDisplayTemperature(value, unit)).toBe(expected);
  });
});
