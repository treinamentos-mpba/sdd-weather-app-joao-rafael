import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import App from '../../src/App';

it('exibe estado inicial, busca o mock e deriva Fahrenheit', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Como está o tempo?' })).toBeInTheDocument();
  await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
  expect(screen.getByRole('status')).toHaveTextContent('Carregando');
  expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
  expect(
    within(screen.getByRole('region', { name: 'São Paulo' })).getByText('26 °C'),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '°F' }));
  expect(
    within(screen.getByRole('region', { name: 'São Paulo' })).getByText('80 °F'),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(5);
});

it('permite visualizar estados e recuperar o erro simulado', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(screen.getByLabelText('Estado da demonstração'), 'empty');
  expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Estado da demonstração'), 'error');
  expect(screen.getByRole('alert')).toHaveTextContent('demonstração');
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(screen.getByRole('main')).toHaveFocus();
  expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
});

it('não apresenta dados de São Paulo como se fossem de outra cidade', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
});
