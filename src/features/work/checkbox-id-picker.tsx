'use client';

type Option = { id: string; label: string; hint?: string };

export function CheckboxIdPicker({
  options,
  selectedIds,
  onChange,
  emptyLabel = 'Nothing to pick yet.',
}: {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
}) {
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    if (selected.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  if (options.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="max-h-56 space-y-2 overflow-y-auto rounded border border-border bg-surface p-3">
      {options.map((option) => (
        <li key={option.id}>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={selected.has(option.id)}
              onChange={() => toggle(option.id)}
            />
            <span>
              <span className="font-medium">{option.label}</span>
              {option.hint ? <span className="mt-0.5 block text-xs text-muted">{option.hint}</span> : null}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
