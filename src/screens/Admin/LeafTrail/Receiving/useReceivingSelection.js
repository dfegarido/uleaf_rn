import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * O(1) plant selection backed by a Set. Subscribers update in isolation so the
 * full Receiving screen does not re-render on every checkbox tap.
 */
export function useReceivingSelection() {
  const idsRef = useRef(new Set());
  const listenersRef = useRef(new Set());

  const notify = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const store = useMemo(
    () => ({
      has: (id) => idsRef.current.has(id),
      get size() {
        return idsRef.current.size;
      },
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => listenersRef.current.delete(listener);
      },
      toggle: (id) => {
        const set = idsRef.current;
        if (set.has(id)) {
          set.delete(id);
        } else {
          set.add(id);
        }
        notify();
      },
      clear: () => {
        if (idsRef.current.size === 0) return;
        idsRef.current.clear();
        notify();
      },
      selectAll: (itemIds) => {
        const set = idsRef.current;
        const ids = itemIds || [];
        if (ids.length > 0 && set.size === ids.length && ids.every((id) => set.has(id))) {
          set.clear();
        } else {
          set.clear();
          ids.forEach((id) => {
            if (id) set.add(id);
          });
        }
        notify();
      },
      toArray: () => Array.from(idsRef.current),
    }),
    [notify],
  );

  return { store };
}

/** Drives FlatList extraData without re-rendering the parent screen. */
export function useSelectionListVersion(selectionStore) {
  const [version, setVersion] = useState(0);
  useEffect(() => selectionStore.subscribe(() => setVersion((v) => v + 1)), [selectionStore]);
  return version;
}

/** For select-all header / badges only. */
export function useSelectionCount(selectionStore) {
  const [count, setCount] = useState(() => selectionStore.size);
  useEffect(
    () => selectionStore.subscribe(() => setCount(selectionStore.size)),
    [selectionStore],
  );
  return count;
}
