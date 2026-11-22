'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';

const DEBOUNCE_MS = 400;

type FolioSearchProps = {
  value: string | null;
  onChange: (folio: string | null) => void;
};

// The text lives in local state while typing; it reaches the URL (and triggers a request)
// only after a pause, or right away on Enter.
export function FolioSearch({ value, onChange }: FolioSearchProps) {
  const [text, setText] = useState(value ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Don't fire a pending search after leaving the screen
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function commit(next: string) {
    clearTimeout(timerRef.current);
    onChange(next || null);
  }

  function handleChange(next: string) {
    const digits = next.replace(/\D/g, ''); // folios are numbers
    setText(digits);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(digits || null), DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    commit(text);
  }

  function clear() {
    setText('');
    commit('');
  }

  return (
    <form role="search" onSubmit={handleSubmit}>
      <Field label="Folio" htmlFor="folio" size="sm">
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
            #
          </span>
          <input
            id="folio"
            inputMode="numeric"
            autoComplete="off"
            value={text}
            onChange={event => handleChange(event.target.value)}
            placeholder="Buscar folio"
            // Own padding: room for the "#" prefix and the clear button
            className="w-36 rounded-lg border border-slate-300 bg-white py-2 pr-8 pl-6"
          />
          {text && (
            <button
              type="button"
              onClick={clear}
              aria-label="Quitar folio"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-1 text-slate-500 hover:bg-slate-100"
            >
              ×
            </button>
          )}
        </div>
      </Field>
    </form>
  );
}
