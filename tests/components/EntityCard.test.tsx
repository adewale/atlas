import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import EntityCard from '../../src/components/EntityCard';
import type { Entity } from '../../src/lib/entities';

afterEach(cleanup);

const ELEMENT_ENTITY: Entity = {
  id: 'element-Fe',
  type: 'element',
  name: 'Fe — Iron',
  description: 'A lustrous, ductile, malleable metal.',
  colour: '#133e7c',
  elements: ['Fe'],
  href: '/elements/Fe',
};

const GROUP_ENTITY: Entity = {
  id: 'group-1',
  type: 'group',
  name: 'Group 1',
  description: 'Alkali metals and hydrogen.',
  colour: '#133e7c',
  elements: ['H', 'Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'],
  href: '/groups/1',
};

const EMPTY_ENTITY: Entity = {
  id: 'era-1900s',
  type: 'era',
  name: '1900s',
  description: '5 elements discovered in the 1900s.',
  colour: '#9e1c2c',
  elements: [],
  href: '/eras/1900',
};

describe('EntityCard', () => {
  it('renders entity name and type label', () => {
    render(<EntityCard entity={ELEMENT_ENTITY} index={0} />);
    expect(screen.getByText('Fe — Iron')).toBeInTheDocument();
    expect(screen.getByText('Element')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<EntityCard entity={ELEMENT_ENTITY} index={0} />);
    expect(screen.getByText(/lustrous, ductile/)).toBeInTheDocument();
  });

  it('shows element count in footer', () => {
    render(<EntityCard entity={GROUP_ENTITY} index={0} />);
    expect(screen.getByText('7 elements')).toBeInTheDocument();
  });

  it('shows singular "element" for 1-element entities', () => {
    render(<EntityCard entity={ELEMENT_ENTITY} index={0} />);
    expect(screen.getByText('1 element')).toBeInTheDocument();
  });

  it('calls onNavigate for element entities', () => {
    const onNavigate = vi.fn();
    render(<EntityCard entity={ELEMENT_ENTITY} index={0} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Fe — Iron'));
    expect(onNavigate).toHaveBeenCalledWith('/elements/Fe');
  });

  it('calls onDrill for group entities with children', () => {
    const onDrill = vi.fn();
    render(<EntityCard entity={GROUP_ENTITY} index={0} onDrill={onDrill} />);
    fireEvent.click(screen.getByText('Group 1'));
    expect(onDrill).toHaveBeenCalledWith(GROUP_ENTITY);
  });

  it('calls onNavigate for entities without children', () => {
    const onNavigate = vi.fn();
    render(<EntityCard entity={EMPTY_ENTITY} index={0} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('1900s'));
    expect(onNavigate).toHaveBeenCalledWith('/eras/1900');
  });

  it('applies stagger animation delay based on index', () => {
    const { container } = render(<EntityCard entity={ELEMENT_ENTITY} index={5} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.animation).toContain('75ms'); // 5 * 15ms
  });

  it('applies content-visibility for off-screen optimization', () => {
    const { container } = render(<EntityCard entity={ELEMENT_ENTITY} index={0} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.contentVisibility).toBe('auto');
  });

  it('shows drill affordance for drillable entities', () => {
    render(<EntityCard entity={GROUP_ENTITY} index={0} />);
    expect(screen.getByText('▸')).toBeInTheDocument();
  });

  it('dims card when dimmed prop is true', () => {
    const { container } = render(<EntityCard entity={ELEMENT_ENTITY} index={0} dimmed />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('0.15');
  });

  it('calls onHover with entity id on mouseenter', () => {
    const onHover = vi.fn();
    render(<EntityCard entity={ELEMENT_ENTITY} index={0} onHover={onHover} />);
    fireEvent.mouseEnter(screen.getByText('Fe — Iron').closest('div')!.parentElement!);
    expect(onHover).toHaveBeenCalledWith('element-Fe');
  });

  it('calls onHover with null on mouseleave', () => {
    const onHover = vi.fn();
    const { container } = render(<EntityCard entity={ELEMENT_ENTITY} index={0} onHover={onHover} />);
    fireEvent.mouseLeave(container.firstChild as HTMLElement);
    expect(onHover).toHaveBeenCalledWith(null);
  });
});
