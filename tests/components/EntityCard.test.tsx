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

const DISCOVERER_ENTITY: Entity = {
  id: 'discoverer-Humphry Davy',
  type: 'discoverer',
  name: 'Humphry Davy',
  description: 'Discovered 6 elements: Na, K, Ca, Ba, Sr, Mg',
  colour: '#856912',
  elements: ['Na', 'K', 'Ca', 'Ba', 'Sr', 'Mg'],
  href: '/discoverers/Humphry%20Davy',
};

const EMPTY_ENTITY: Entity = {
  id: 'discoverer-Unknown',
  type: 'discoverer',
  name: 'Unknown',
  description: 'No elements attributed.',
  colour: '#856912',
  elements: [],
  href: null,
};

const SAMPLE_REFS: CrossRef[] = [
  { id: 'discoverer-Marie Curie', name: 'Marie Curie', type: 'discoverer', colour: '#856912', href: '/discoverers/Marie%20Curie', rel: 'discovered' },
  { id: 'element-Na', name: 'Na — Sodium', type: 'element', colour: '#133e7c', href: '/elements/Na', rel: 'discovered' },
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
    render(<EntityCard entity={DISCOVERER_ENTITY} index={0} />);
    expect(screen.getByText('6 elements')).toBeInTheDocument();
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
    render(<EntityCard entity={DISCOVERER_ENTITY} index={0} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('Humphry Davy'));
    expect(onExpand).toHaveBeenCalledWith('discoverer-Humphry Davy');
  });

  it('calls onExpand(null) when clicking an already expanded card', () => {
    const onExpand = vi.fn();
    render(<EntityCard entity={DISCOVERER_ENTITY} index={0} expanded onExpand={onExpand} />);
    // Click the card body (not a button inside it)
    const card = screen.getByText('Humphry Davy').closest('div')!.parentElement!;
    fireEvent.click(card);
    expect(onExpand).toHaveBeenCalledWith(null);
  });

  it('calls onExpand for entities without children and href when clicked', () => {
    const onExpand = vi.fn();
    render(<EntityCard entity={EMPTY_ENTITY} index={0} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('Unknown'));
    expect(onExpand).toHaveBeenCalledWith('discoverer-Unknown');
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
    render(<EntityCard entity={DISCOVERER_ENTITY} index={0} />);
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
      <EntityCard entity={DISCOVERER_ENTITY} index={0} expanded crossRefs={SAMPLE_REFS} />,
    );
    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Marie Curie')).toBeInTheDocument();
    expect(screen.getByText('Na — Sodium')).toBeInTheDocument();
  });

  it('shows "Read more" and "Show elements" actions when expanded', () => {
    const onDrill = vi.fn();
    const onNavigate = vi.fn();
    render(
      <EntityCard
        entity={DISCOVERER_ENTITY}
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
      <EntityCard entity={DISCOVERER_ENTITY} index={0} expanded onDrill={onDrill} />,
    );
    fireEvent.click(screen.getByText(/Show elements/));
    expect(onDrill).toHaveBeenCalledWith(DISCOVERER_ENTITY);
  });

  it('Read more button calls onNavigate', () => {
    const onNavigate = vi.fn();
    render(
      <EntityCard entity={DISCOVERER_ENTITY} index={0} expanded onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByText(/Read more/));
    expect(onNavigate).toHaveBeenCalledWith('/discoverers/Humphry%20Davy');
  });

  it('cross-ref chip navigates to target href', () => {
    const onNavigate = vi.fn();
    render(
      <EntityCard entity={DISCOVERER_ENTITY} index={0} expanded crossRefs={SAMPLE_REFS} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByText('Na — Sodium'));
    expect(onNavigate).toHaveBeenCalledWith('/elements/Na');
  });

  it('expanded card has entity colour border', () => {
    const { container } = render(
      <EntityCard entity={DISCOVERER_ENTITY} index={0} expanded />,
    );
    const card = container.firstChild as HTMLElement;
    // jsdom converts hex to rgb
    // #856912 → rgb(133, 105, 18)
    expect(card.style.borderColor).toBe('rgb(133, 105, 18)');
  });

  it('expanded card spans full grid width', () => {
    const { container } = render(
      <EntityCard entity={DISCOVERER_ENTITY} index={0} expanded />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.style.gridColumn).toBe('1 / -1');
  });

  it('hides footer when expanded', () => {
    render(<EntityCard entity={DISCOVERER_ENTITY} index={0} expanded />);
    // The ▸ affordance from the footer should not appear
    // (only the "Show elements ▸" button which has different text)
    const arrows = screen.queryAllByText('▸');
    expect(arrows).toHaveLength(0);
  });
});
