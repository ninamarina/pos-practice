import type { Category } from '@/types/domain';

type CategoryTabsProps = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
  const tabs = [{ id: null, name: 'Todo' }, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map(tab => (
        <button
          key={tab.id ?? 'all'}
          type="button"
          onClick={() => onSelect(tab.id)}
          aria-pressed={selectedId === tab.id}
          className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
            selectedId === tab.id
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
