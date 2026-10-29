import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import mockWeatherData from '../../src/mocks/weatherData';

const { days } = mockWeatherData;

describe('ForecastList', () => {
  it('renderiza cinco cards em ordem com o grid responsivo solicitado', () => {
    render(<ForecastList days={days} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(list).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3', 'lg:grid-cols-5');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(
      within(list)
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['qui., 29/10', 'sex., 30/10', 'sáb., 31/10', 'dom., 01/11', 'seg., 02/11']);
  });

  it('repassa a unidade para todos os cards', () => {
    render(<ForecastList days={days} unit="fahrenheit" />);

    for (const card of screen.getAllByRole('article')) {
      expect(within(card).getAllByText(/°F$/)).toHaveLength(2);
      expect(within(card).queryByText(/°C$/)).not.toBeInTheDocument();
    }
  });

  it('apresenta estado vazio sem cards', () => {
    render(<ForecastList days={[]} unit="celsius" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma previsão disponível.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it.each([
    days.slice(0, 4),
    [...days, { ...days[4], date: '2026-11-03' }],
    days.map((day, index) => (index === 1 ? { ...day, date: days[0].date } : day)),
    days.map((day, index) => (index === 1 ? { ...day, date: '2026-02-30' } : day)),
    days.map((day, index) => (index === 1 ? { ...day, temperatureMaxC: Number.NaN } : day)),
    days.map((day, index) =>
      index === 1 ? { ...day, temperatureMinC: day.temperatureMaxC + 1 } : day,
    ),
    days.map((day, index) => (index === 1 ? { ...day, precipitationProbabilityPercent: -1 } : day)),
    days.map((day, index) =>
      index === 1 ? { ...day, precipitationProbabilityPercent: 101 } : day,
    ),
  ])('rejeita previsão incompleta ou inválida sem exibir cards parciais (%#)', (...invalidDays) => {
    render(<ForecastList days={invalidDays} unit="celsius" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Dados de previsão inválidos');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
