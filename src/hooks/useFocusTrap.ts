import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
interface ActiveTrap {
  id: symbol;
  node: HTMLElement;
}

const activeTraps: ActiveTrap[] = [];

interface FocusTrapOptions {
  onEscape?: () => void;
  escapeDisabled?: boolean;
}

/**
 * Trap focus inside the returned element while `active` is true: moves focus in
 * on activation, cycles Tab/Shift+Tab within the element, and restores focus to
 * the previously focused element on deactivation/unmount. The container should
 * set `tabIndex={-1}` so it can receive focus as a fallback.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  { onEscape, escapeDisabled = false }: FocusTrapOptions = {},
) {
  const ref = useRef<T>(null);
  const onEscapeRef = useRef(onEscape);
  const escapeDisabledRef = useRef(escapeDisabled);
  onEscapeRef.current = onEscape;
  escapeDisabledRef.current = escapeDisabled;

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const trapId = Symbol('focus-trap');
    const trap = { id: trapId, node };
    const firstDescendant = activeTraps.findIndex((activeTrap) => node.contains(activeTrap.node));
    if (firstDescendant === -1) activeTraps.push(trap);
    else activeTraps.splice(firstDescendant, 0, trap);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));

    const initial = focusables();
    (initial[0] ?? node).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeTraps[activeTraps.length - 1]?.id === trapId) {
        if (escapeDisabledRef.current || onEscapeRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!escapeDisabledRef.current) {
          onEscapeRef.current?.();
        }
        return;
      }

      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        e.preventDefault();
        node.focus();
        return;
      }
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || activeEl === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      const index = activeTraps.findIndex((activeTrap) => activeTrap.id === trapId);
      if (index !== -1) activeTraps.splice(index, 1);
      previouslyFocused?.focus?.();
    };
  }, [active]);

  return ref;
}
