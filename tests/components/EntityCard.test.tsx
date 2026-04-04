import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import EntityCard from '../../src/components/EntityCard';
import type { CrossRef } from '../../src/components/EntityCard';
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

const SAMPLE_REFS: CrossRef[] = [
  { id: 'category-transition metal', name: 'Transition metals', type: 'category', colour: '#133e7c', href: '/categories/transition metal', rel: 'member_of' },
  { id: 'block-d', name: 'd-block', type: 'block', colour: '#856912', href: '/blocks/d', rel: 'belongs_to' },
];

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

  it('shows element count in footer when collapsed', () => {
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

  it('calls onExpand for non-element entities on click', () => {
    const onExpand = vi.fn();
    render(<EntityCard entity={GROUP_ENTITY} index={0} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('Group 1'));
    expect(onExpand).toHaveBeenCalledWith('group-1');
  });

  it('calls onExpand(null) when clicking an already expanded card', () => {
    const onExpand = vi.fn();
    render(<EntityCard entity={GROUP_ENTITY} index={0} expanded onExpand={onExpand} />);
    // Click the card body (not a button inside it)
    const card = screen.getByText('Group 1').closest('div')!.parentElement!;
    fireEvent.click(card);
    expect(onExpand).toHaveBeenCalledWith(null);
  });

  it('calls onNavigate for entities without children when no onExpand', () => {
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

  it('shows drill affordance when collapsed', () => {
    render(<EntityCard entity={GROUP_ENTITY} index={0} />);
    expect(screen.getByText('▸')).toBeInTheDocument();
  });

  it('dims card when dimmed prop is true', () => {
    const { container } = render(<EntityCard entity={ELEMENT_ENTITY} index={0} dimmed />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.filter).toBe('opacity(0.15)');
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

  // --- Progressive disclosure / expansion tests ---

  it('shows cross-ref chips when expanded with crossRefs', () => {
    render(
      <EntityCard entity={GROUP_ENTITY} index={0} expanded crossRefs={SAMPLE_REFS} />,
    );
    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Transition metals')).toBeInTheDocument();
    expect(screen.getByText('d-block')).toBeInTheDocument();
  });

  it('shows "Read more" and "Show elements" actions when expanded', () => {
    const onDrill = vi.fn();
    const onNavigate = vi.fn();
    render(
      <EntityCard
        entity={GROUP_ENTITY}
        index={0}
        expanded
        crossRefs={SAMPLE_REFS}
        onDrill={onDrill}
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getByText(/Show elements/)).toBeInTheDocument();
    expect(screen.getByText(/Read more/)).toBeInTheDocument();
  });

  it('Show elements button calls onDrill', () => {
    const onDrill = vi.fn();
    render(
      <EntityCard entity={GROUP_ENTITY} index={0} expanded onDrill={onDrill} />,
    );
    fireEvent.click(screen.getByText(/Show elements/));
    expect(onDrill).toHaveBeenCalledWith(GROUP_ENTITY);
  });

  it('Read more button calls onNavigate', () => {
    const onNavigate = vi.fn();
    render(
      <EntityCard entity={GROUP_ENTITY} index={0} expanded onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByText(/Read more/));
    expect(onNavigate).toHaveBeenCalledWith('/groups/1');
  });

  it('cross-ref chip navigates to target href', () => {
    const onNavigate = vi.fn();
    render(
      <EntityCard entity={GROUP_ENTITY} index={0} expanded crossRefs={SAMPLE_REFS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByText('Transition metals'));
    expect(onNavigate).toHaveBeenCalledWith('/categories/transition metal');
  });

  it('expanded card has entity colour border', () => {
    const { container } = render(
      <EntityCard entity={GROUP_ENTITY} index={0} expanded />,
    );
    const card = container.firstChild as HTMLElement;
    // jsdom converts hex to rgb
    expect(card.style.borderColor).toBe('rgb(19, 62, 124)');
  });

  it('expanded card spans full grid width', () => {
    const { container } = render(
      <EntityCard entity={GROUP_ENTITY} index={0} expanded />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.style.gridColumn).toBe('1 / -1');
  });

  it('hides footer when expanded', () => {
    render(<EntityCard entity={GROUP_ENTITY} index={0} expanded />);
    // The ▸ affordance from the footer should not appear
    // (only the "Show elements ▸" button which has different text)
    const arrows = screen.queryAllByText('▸');
    expect(arrows).toHaveLength(0);
  });
});
