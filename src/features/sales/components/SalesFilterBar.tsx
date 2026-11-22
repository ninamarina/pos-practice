'use client';

import { Field } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { dayInZone, resolvePreset, type DateRangePreset } from '@/lib/dates';
import { STORE_TIME_ZONE } from '@/lib/store-config';
import type { PaymentMethod, User } from '@/types/domain';
import type { SalesFilters } from '../filters';
import { FolioSearch } from './FolioSearch';

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  month: 'Este mes',
};

type SalesFilterBarProps = {
  filters: SalesFilters;
  cashiers: User[];
  updating: boolean; // new results are loading (the table shows the previous ones meanwhile)
  onChange: (changes: Partial<Omit<SalesFilters, 'page'>>) => void;
};

export function SalesFilterBar({ filters, cashiers, updating, onChange }: SalesFilterBarProps) {
  const searchingFolio = filters.folio !== null;
  const { date } = filters;
  const today = dayInZone(new Date(), STORE_TIME_ZONE);

  function handleDateTypeChange(value: string) {
    if (value === 'custom') {
      // Start the custom range from what the user was looking at
      const current = date.type === 'custom' ? date : resolvePreset(date.preset, today);
      onChange({ date: { type: 'custom', from: current.from, to: current.to } });
    } else {
      onChange({ date: { type: 'preset', preset: value as DateRangePreset } });
    }
  }

  function handleCustomChange(edge: 'from' | 'to', value: string) {
    if (date.type !== 'custom' || !value) return;
    let { from, to } = date;
    if (edge === 'from') from = value;
    else to = value;
    // Keep the range valid instead of showing an error: moving one end past the other drags it along
    if (from > to) {
      if (edge === 'from') to = from;
      else from = to;
    }
    onChange({ date: { type: 'custom', from, to } });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* While searching by folio the other filters don't apply, so they're disabled (not hidden or cleared) */}
        <fieldset disabled={searchingFolio} className="flex flex-wrap items-end gap-3">
          <legend className="sr-only">Filtros</legend>
          <Field label="Fecha" htmlFor="date-range" size="sm">
            <Select
              id="date-range"
              value={date.type === 'custom' ? 'custom' : date.preset}
              onChange={event => handleDateTypeChange(event.target.value)}
            >
              {Object.entries(PRESET_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
              <option value="custom">Elegir fechas…</option>
            </Select>
          </Field>

          {date.type === 'custom' && (
            <>
              <Field label="Desde" htmlFor="date-from" size="sm">
                <Input
                  id="date-from"
                  type="date"
                  value={date.from}
                  max={today}
                  onChange={event => handleCustomChange('from', event.target.value)}
                />
              </Field>
              <Field label="Hasta" htmlFor="date-to" size="sm">
                <Input
                  id="date-to"
                  type="date"
                  value={date.to}
                  max={today}
                  onChange={event => handleCustomChange('to', event.target.value)}
                />
              </Field>
            </>
          )}

          <Field label="Cajero" htmlFor="cashier" size="sm">
            <Select
              id="cashier"
              value={filters.cashierId ?? ''}
              onChange={event => onChange({ cashierId: event.target.value || null })}
            >
              <option value="">Todos</option>
              {cashiers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Pago" htmlFor="method" size="sm">
            <Select
              id="method"
              value={filters.method ?? ''}
              onChange={event => onChange({ method: (event.target.value || null) as PaymentMethod | null })}
            >
              <option value="">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
            </Select>
          </Field>
        </fieldset>

        <FolioSearch value={filters.folio} onChange={folio => onChange({ folio })} />

        {updating && (
          <span className="pb-2">
            <Spinner label="Actualizando resultados" />
          </span>
        )}
      </div>

      {searchingFolio && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Buscando el folio <strong>#{filters.folio}</strong> en todas las fechas. Los otros filtros no se aplican
          mientras haya un folio.
        </p>
      )}
    </div>
  );
}
