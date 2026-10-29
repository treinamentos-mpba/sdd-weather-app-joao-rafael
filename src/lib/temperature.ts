import type { Unit } from '../types/weather';

export function toDisplayTemperature(valueC: number, unit: Unit): number {
  const converted = unit === 'fahrenheit' ? (valueC * 9) / 5 + 32 : valueC;
  const rounded = Math.sign(converted) * Math.round(Math.abs(converted));
  return rounded === 0 ? 0 : rounded;
}
