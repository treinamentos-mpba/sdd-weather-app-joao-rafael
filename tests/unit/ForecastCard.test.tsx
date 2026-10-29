import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import mockWeatherData from '../../src/mocks/weatherData';

const day = mockWeatherData.days[0];

describe('ForecastCard', () => {
  it('mostra traço, não zero, para probabilidade desconhecida', () => {
    render(<ForecastCard day={{ ...day, precipitationProbabilityPercent: null }} unit="celsius" />);
    expect(screen.getByText('—', { exact: true })).toBeVisible();
    expect(screen.queryByText('0 %')).not.toBeInTheDocument();
  });

  it('exibe dia, data, condição e temperaturas em Celsius', () => {
    render(<ForecastCard day={day} unit="celsius" />);

    expect(screen.getByRole('article', { name: 'qui., 29/10' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'qui., 29/10' }).firstChild).toHaveAttribute(
      'dateTime',
      '2026-10-29',
    );
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Máxima')).toBeInTheDocument();
    expect(screen.getByText('29 °C')).toBeInTheDocument();
    expect(screen.getByText('Mínima')).toBeInTheDocument();
    expect(screen.getByText('22 °C')).toBeInTheDocument();
    expect(screen.getByText('Probabilidade de chuva')).toBeInTheDocument();
    expect(screen.getByText('20 %')).toBeInTheDocument();
  });

  it('converte máxima e mínima ao mudar a unidade sem rede ou mutação', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const original = structuredClone(day);
    try {
      const { rerender } = render(<ForecastCard day={day} unit="celsius" />);
      rerender(<ForecastCard day={day} unit="fahrenheit" />);

      expect(screen.getByText('84 °F')).toBeInTheDocument();
      expect(screen.getByText('71 °F')).toBeInTheDocument();
      expect(screen.getByText('20 %')).toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(day).toEqual(original);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it.each([0, 100])('preserva probabilidade de %s por cento', (probability) => {
    render(
      <ForecastCard
        day={{ ...day, precipitationProbabilityPercent: probability }}
        unit="celsius"
      />,
    );
    expect(screen.getByText(`${probability} %`)).toBeInTheDocument();
  });

  it('mostra texto e ícone neutros para código desconhecido', () => {
    render(<ForecastCard day={{ ...day, weatherCode: 999 }} unit="celsius" />);
    expect(screen.getByText('Condição meteorológica indisponível')).toBeInTheDocument();
    expect(screen.getByText('◇')).toHaveAttribute('aria-hidden', 'true');
  });
});
