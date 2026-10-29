import { describe, expect, it } from 'vitest';
import { toDisplayTemperature } from '../../src/lib/temperature';
import type { Unit } from '../../src/types/weather';

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
