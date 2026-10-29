import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import mockWeatherData from '../../src/mocks/weatherData';

const { city, current } = mockWeatherData;

describe('CurrentWeather', () => {
  it('exibe traços para métricas ausentes, inclusive sensação em Fahrenheit', () => {
    render(
      <CurrentWeather
        city={city}
        current={{
          ...current,
          apparentTemperatureC: null,
          relativeHumidityPercent: null,
          windSpeedKmh: null,
          pressureMslHpa: null,
        }}
        unit="fahrenheit"
      />,
    );
    expect(screen.getByText('Sensação térmica: —')).toBeInTheDocument();
    expect(screen.getAllByText('—', { exact: true })).toHaveLength(3);
    expect(screen.getByRole('region')).not.toHaveTextContent(/NaN|undefined|null|32 °F/);
  });

  it('exibe cidade, condição, referência e todas as métricas em pt-BR', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('São Paulo, Brasil')).toBeInTheDocument();
    expect(screen.getByText('26 °C')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 27 °C')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Umidade')).toBeInTheDocument();
    expect(screen.getByText('68 %')).toBeInTheDocument();
    expect(screen.getByText('Vento')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(screen.getByText('Precipitação')).toBeInTheDocument();
    expect(screen.getByText('0,2 mm')).toBeInTheDocument();
    expect(screen.getByText('Pressão ao nível do mar')).toBeInTheDocument();
    expect(screen.getByText('1.013,2 hPa')).toBeInTheDocument();
    expect(screen.getByText('29/10/2026, 14:00')).toHaveAttribute('dateTime', current.observedAt);
  });

  it('deriva Fahrenheit das props sem alterar os dados originais ou outras métricas', () => {
    const original = structuredClone(current);
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);
    rerender(<CurrentWeather city={city} current={current} unit="fahrenheit" />);

    expect(screen.getByText('80 °F')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 81 °F')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(screen.getByText('0,2 mm')).toBeInTheDocument();
    expect(screen.getByText('1.013,2 hPa')).toBeInTheDocument();
    expect(current).toEqual(original);
  });

  it('mostra coordenadas quando região e país estão ausentes', () => {
    render(
      <CurrentWeather
        city={{ ...city, region: null, country: null }}
        current={current}
        unit="celsius"
      />,
    );
    expect(screen.getByText('-23,55, -46,63')).toBeInTheDocument();
  });

  it('mostra condição neutra e registra somente o código desconhecido', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <CurrentWeather city={city} current={{ ...current, weatherCode: 999 }} unit="celsius" />,
      );
      expect(screen.getByText('Condição meteorológica indisponível')).toBeInTheDocument();
      expect(screen.getByText('◇')).toHaveAttribute('aria-hidden', 'true');
      expect(warning).toHaveBeenCalledWith('Código meteorológico desconhecido:', 999);
    } finally {
      warning.mockRestore();
    }
  });

  it('mantém valores zero de precipitação, vento e umidade', () => {
    render(
      <CurrentWeather
        city={city}
        current={{ ...current, precipitationMm: 0, windSpeedKmh: 0, relativeHumidityPercent: 0 }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getByText('0 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeInTheDocument();
  });

  it.each([
    { temperatureC: Number.NaN },
    { pressureMslHpa: Number.POSITIVE_INFINITY },
    { precipitationMm: -1 },
    { relativeHumidityPercent: 101 },
  ])('expõe erro em vez de um cartão com dados inválidos: %j', (invalid) => {
    render(<CurrentWeather city={city} current={{ ...current, ...invalid }} unit="celsius" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Dados meteorológicos inválidos');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
