import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../../src/App';
import mockWeatherData from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  getWeather: vi.fn(),
  searchCities: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(searchCities).mockReset().mockResolvedValue([mockWeatherData.city]);
  vi.mocked(getWeather).mockReset().mockResolvedValue(mockWeatherData);
});

it('inicia sem requests, carrega os dados e converte sem nova chamada de rede', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Como está o tempo?' })).toBeInTheDocument();
  expect(searchCities).not.toHaveBeenCalled();
  await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
  const region = await screen.findByRole('region', { name: 'São Paulo' });
  expect(within(region).getByText('26 °C')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '°F' }));
  expect(within(region).getByText('80 °F')).toBeInTheDocument();
  expect(getWeather).toHaveBeenCalledTimes(1);
  expect(searchCities).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('article')).toHaveLength(5);
});

it('exibe vazio sem forecast e permite uma nova busca', async () => {
  vi.mocked(searchCities).mockResolvedValueOnce([]);
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByRole('searchbox'), 'Inexistente{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
  ).toBeInTheDocument();
  expect(getWeather).not.toHaveBeenCalled();
});

it('mostra erro transitório e repete somente o forecast mantendo o foco', async () => {
  vi.mocked(getWeather).mockRejectedValueOnce(
    new WeatherServiceError('Falha de rede.', undefined, 'network'),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(screen.getByRole('main')).toHaveFocus();
  expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
  expect(searchCities).toHaveBeenCalledTimes(1);
  expect(getWeather).toHaveBeenCalledTimes(2);
});

it('não oferece retry para erro permanente', async () => {
  vi.mocked(searchCities).mockRejectedValueOnce(new WeatherServiceError('Cidade inválida.', 400));
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByRole('searchbox'), 'Cidade{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Cidade inválida.');
  expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
});
