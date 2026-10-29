import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

it('anuncia carregamento por status', () => {
  render(<LoadingState />);
  expect(screen.getByRole('status')).toHaveTextContent('Carregando previsão');
});

it('exibe título e dica no estado vazio', () => {
  render(<EmptyState title="Sem cidades" hint="Tente outra busca." />);
  expect(screen.getByRole('heading', { name: 'Sem cidades' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Tente outra busca.');
});

it('anuncia erro e permite retry manual por teclado', async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  render(<ErrorState message="Falha de rede" onRetry={onRetry} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede');
  expect(onRetry).not.toHaveBeenCalled();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(onRetry).toHaveBeenCalledTimes(1);
});

it('não oferece retry quando não há callback', () => {
  render(<ErrorState message="Erro permanente" />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
