"use client";

import { X } from "lucide-react";

interface ActiveFilterChipProps {
  label: string;
  key: string;
  onRemove: () => void;
}

export function ActiveFilterChip({ label, key, onRemove }: ActiveFilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-dark shadow-sm">
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="rounded-full p-0.5 text-muted hover:bg-primary-light hover:text-primary-dark"
        aria-label={`Remove ${key} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

interface ActiveFilterChipsProps {
  chips: Array<{ key: string; label: string }>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-muted hidden sm:block">
        Applied filters:
      </span>
      {chips.map((chip) => (
        <ActiveFilterChip
          key={chip.key}
          label={chip.label}
          onRemove={() => onRemove(chip.key)}
        />
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-primary-600 underline underline-offset-4 hover:text-primary-700"
      >
        Clear all
      </button>
    </div>
  );
}
