import type { Unit } from '../types/weather';

export function convertTemperature(valueC: number, unit: Unit): number {
  return unit === 'fahrenheit' ? (valueC * 9) / 5 + 32 : valueC;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function toDisplayTemperature(valueC: number, unit: Unit): number {
  const converted = convertTemperature(valueC, unit);
  const rounded = Math.sign(converted) * Math.round(Math.abs(converted));
  return rounded === 0 ? 0 : rounded;
}

export function formatTemperature(valueC: number, unit: Unit): string {
  return `${toDisplayTemperature(valueC, unit).toLocaleString('pt-BR')} ${unitLabel(unit)}`;
}
