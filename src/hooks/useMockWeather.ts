import { useEffect, useState } from 'react';

export type DemoStatus = 'idle' | 'loading' | 'empty' | 'error' | 'success';

export default function useMockWeather() {
  const [state, setState] = useState<{ status: DemoStatus; query: string }>({
    status: 'idle',
    query: '',
  });

  useEffect(() => {
    if (state.status !== 'loading') return;
    const timer = window.setTimeout(() => {
      const normalized = state.query
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
      setState({ ...state, status: normalized === 'sao paulo' ? 'success' : 'empty' });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [state]);

  function search(query: string) {
    if (!query.trim()) return;
    setState({ status: 'loading', query: query.trim() });
  }

  function preview(status: DemoStatus) {
    setState({ status, query: 'São Paulo' });
  }

  return { status: state.status, search, preview, retry: () => search('São Paulo') };
}
