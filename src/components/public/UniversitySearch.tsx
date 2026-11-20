"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface UniversitySearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function UniversitySearch({
  value,
  onChange,
  onClear,
}: UniversitySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div className="relative w-full max-w-3xl">
      <label htmlFor="university-directory-search" className="sr-only">
        Search universities by name, country, city or programme
      </label>
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          id="university-directory-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search universities by name, country, city or programme…"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "min-h-[56px] w-full rounded-xl border border-gray-200 bg-white px-3 pr-10 text-base text-gray-900 shadow-sm transition-all",
            value
              ? "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              : "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
            isFocused && "shadow-md"
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        Search by university name, country, city or available programmes
      </p>
    </div>
  );
}

export function FilterChip({
  label,
  key: chipKey,
  onRemove,
}: {
  label: string;
  key: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs">
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        aria-label={`Remove ${chipKey} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
