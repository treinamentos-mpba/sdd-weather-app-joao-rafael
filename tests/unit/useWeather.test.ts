import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import mockWeatherData from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  getWeather: vi.fn(),
  searchCities: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.mocked(searchCities).mockReset().mockResolvedValue([mockWeatherData.city]);
  vi.mocked(getWeather).mockReset().mockResolvedValue(mockWeatherData);
});

describe('useWeather', () => {
  it('inicia idle sem rede e ignora retry sem operação', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      query: '',
      error: null,
    });
    await act(() => result.current.retry());
    await act(() => result.current.search('   '));
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('busca termo trimado e carrega a primeira cidade preservando a lista', async () => {
    const second = { ...mockWeatherData.city, name: 'Outra cidade' };
    vi.mocked(searchCities).mockResolvedValue([mockWeatherData.city, second]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(' São Paulo '));
    expect(searchCities).toHaveBeenCalledWith('São Paulo');
    expect(getWeather).toHaveBeenCalledWith(mockWeatherData.city);
    expect(result.current).toMatchObject({
      status: 'success',
      data: mockWeatherData,
      query: 'São Paulo',
      error: null,
    });
    expect(result.current.cities).toEqual([mockWeatherData.city, second]);
  });

  it('expõe loading e não duplica a operação pendente', async () => {
    const response = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValue(response.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.selectCity(mockWeatherData.city);
    });
    expect(result.current.status).toBe('loading');
    await act(() => result.current.selectCity(mockWeatherData.city));
    expect(getWeather).toHaveBeenCalledTimes(1);
    await act(async () => {
      response.resolve(mockWeatherData);
      await request;
    });
    expect(result.current.status).toBe('success');
  });

  it('expõe empty sem chamar forecast', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Sem cidade'));
    expect(result.current).toMatchObject({ status: 'empty', data: null, cities: [], error: null });
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('não repete a busca enquanto o forecast da primeira cidade está pendente', async () => {
    const response = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(response.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('São Paulo');
    });
    await waitFor(() => expect(getWeather).toHaveBeenCalledTimes(1));
    await act(() => result.current.search('São Paulo'));
    await act(() => result.current.selectCity(mockWeatherData.city));
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
    await act(async () => {
      response.resolve(mockWeatherData);
      await request;
    });
  });

  it('repete o geocoding se essa foi a etapa que falhou', async () => {
    const error = new WeatherServiceError('Falha de rede.', undefined, 'network');
    vi.mocked(searchCities).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current.error).toBe(error);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
  });

  it('repete só forecast e limpa erro quando o carregamento é retomado', async () => {
    vi.mocked(getWeather).mockRejectedValueOnce(new WeatherServiceError('Indisponível', 503));
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');
    await act(() => result.current.retry());
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it.each([
    'success',
    'error',
  ])('descarta forecast antigo com %s após nova seleção', async (outcome) => {
    const old = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(old.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.selectCity(mockWeatherData.city);
    });

    const other = {
      ...mockWeatherData,
      city: { ...mockWeatherData.city, name: 'Outra cidade', latitude: 10 },
    };
    vi.mocked(getWeather).mockResolvedValueOnce(other);
    await act(() => result.current.selectCity(other.city));
    await act(async () => {
      if (outcome === 'success') old.resolve(mockWeatherData);
      else old.reject(new WeatherServiceError('Erro antigo'));
      await request;
    });
    expect(result.current.data).toEqual(other);
    expect(result.current.error).toBeNull();
  });

  it('não inicia forecast para resultado de busca substituída', async () => {
    const old = deferred<(typeof mockWeatherData.city)[]>();
    vi.mocked(searchCities).mockReturnValueOnce(old.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('Antiga');
    });
    await act(() => result.current.search('Nova'));
    await act(async () => {
      old.resolve([mockWeatherData.city]);
      await request;
    });
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(result.current.query).toBe('Nova');
  });

  it('limpar busca invalida resposta pendente e retry', async () => {
    const old = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(old.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.selectCity(mockWeatherData.city);
    });
    await act(() => result.current.search(''));
    await act(async () => {
      old.resolve(mockWeatherData);
      await request;
    });
    expect(result.current.status).toBe('idle');
    await act(() => result.current.retry());
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('não encadeia requests após desmontagem', async () => {
    const old = deferred<(typeof mockWeatherData.city)[]>();
    vi.mocked(searchCities).mockReturnValueOnce(old.promise);
    const { result, unmount } = renderHook(() => useWeather());
    act(() => {
      void result.current.search('Cidade');
    });
    unmount();
    old.resolve([mockWeatherData.city]);
    await waitFor(() => expect(getWeather).not.toHaveBeenCalled());
  });
});
