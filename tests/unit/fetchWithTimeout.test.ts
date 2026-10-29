import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout, WeatherServiceError } from '../../src/services/weatherService';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchWithTimeout', () => {
  it('retorna a resposta e remove o timer após sucesso', async () => {
    const response = new Response('{}');
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchWithTimeout('https://example.test')).toBe(response);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('https://example.test', {
      signal: expect.any(AbortSignal),
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborta aos 10s, não aos 9.999ms, e converte AbortError', async () => {
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        const signal = options.signal;
        if (!signal) throw new Error('Sinal de aborto ausente');
        requestSignal = signal;
        return new Promise<Response>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }),
    );
    const request = fetchWithTimeout('https://example.test');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(requestSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(requestSignal?.aborted).toBe(true);
    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('converte falha de rede em WeatherServiceError e limpa o timer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const request = fetchWithTimeout('https://example.test');
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toThrow('Falha de rede.');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserva falhas inesperadas e ainda limpa o timer', async () => {
    const error = new Error('Erro inesperado');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    await expect(fetchWithTimeout('https://example.test')).rejects.toBe(error);
    expect(vi.getTimerCount()).toBe(0);
  });
});
