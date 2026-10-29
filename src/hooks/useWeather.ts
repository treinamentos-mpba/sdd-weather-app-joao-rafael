import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'empty';
type Operation = { type: 'search'; name: string } | { type: 'weather'; city: City };

interface WeatherState {
  status: Status;
  data: WeatherData | null;
  cities: City[];
  error: WeatherServiceError | null;
  query: string;
}

const initialState: WeatherState = {
  status: 'idle',
  data: null,
  cities: [],
  error: null,
  query: '',
};

export default function useWeather() {
  const [state, setState] = useState<WeatherState>(initialState);
  const lastOperation = useRef<Operation | null>(null);
  const requestId = useRef(0);
  const pendingKeys = useRef<string[]>([]);

  useEffect(
    () => () => {
      requestId.current += 1;
      pendingKeys.current = [];
    },
    [],
  );

  const execute = useCallback(async (operation: Operation) => {
    const key =
      operation.type === 'search'
        ? `search:${operation.name}`
        : `weather:${operation.city.latitude},${operation.city.longitude}`;
    if (pendingKeys.current.includes(key)) return;
    const id = ++requestId.current;
    pendingKeys.current = [key];
    lastOperation.current = operation;
    setState((previous) => ({
      ...previous,
      status: 'loading',
      data: null,
      error: null,
      cities: operation.type === 'search' ? [] : previous.cities,
      query: operation.type === 'search' ? operation.name : previous.query,
    }));

    try {
      let city: City;
      if (operation.type === 'search') {
        const cities = await searchCities(operation.name);
        if (id !== requestId.current) return;
        if (!cities.length) {
          setState({ ...initialState, status: 'empty', query: operation.name });
          return;
        }
        city = cities[0];
        setState((previous) => ({ ...previous, cities }));
        lastOperation.current = { type: 'weather', city };
        pendingKeys.current.push(`weather:${city.latitude},${city.longitude}`);
      } else {
        city = operation.city;
      }
      const data = await getWeather(city);
      if (id !== requestId.current) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (reason) {
      if (id !== requestId.current) return;
      const error =
        reason instanceof WeatherServiceError
          ? reason
          : new WeatherServiceError('Não foi possível carregar os dados meteorológicos.');
      setState((previous) => ({ ...previous, status: 'error', data: null, error }));
    } finally {
      if (id === requestId.current) pendingKeys.current = [];
    }
  }, []);

  const search = useCallback(
    (name: string) => {
      const query = name.trim();
      if (!query) {
        requestId.current += 1;
        pendingKeys.current = [];
        lastOperation.current = null;
        setState(initialState);
        return Promise.resolve();
      }
      return execute({ type: 'search', name: query });
    },
    [execute],
  );

  const selectCity = useCallback((city: City) => execute({ type: 'weather', city }), [execute]);
  const retry = useCallback(() => {
    return lastOperation.current ? execute(lastOperation.current) : Promise.resolve();
  }, [execute]);

  return { ...state, search, selectCity, retry };
}
