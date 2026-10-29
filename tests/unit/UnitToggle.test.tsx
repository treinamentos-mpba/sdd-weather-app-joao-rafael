import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';
import type { Unit } from '../../src/types/weather';

describe('UnitToggle', () => {
  it.each<Unit>(['celsius', 'fahrenheit'])('indica a unidade %s recebida por props', (unit) => {
    render(<UnitToggle unit={unit} onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: '°C' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'celsius'),
    );
    expect(within(group).getByRole('button', { name: '°F' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'fahrenheit'),
    );
  });

  it('emite a unidade selecionada e só atualiza o ativo após receber novas props', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(onChange).toHaveBeenLastCalledWith('fahrenheit');
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(onChange).toHaveBeenLastCalledWith('celsius');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('navega com Tab e Shift+Tab e ativa com Enter e Espaço sem enviar o formulário', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={onChange} />
      </form>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('celsius');

    await user.tab();
    expect(screen.getByRole('button', { name: '°F' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith('fahrenheit');

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
