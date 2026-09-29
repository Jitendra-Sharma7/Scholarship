"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import type { AdminSearchHit } from "@/lib/admin-search";
import { searchAdminContent } from "@/app/actions/admin-search-actions";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

const ENTITY_LABEL: Record<AdminSearchHit["entity"], string> = {
  Scholarship: "Scholarship",
  University: "University",
  Country: "Country",
  Field: "Field",
  BlogPost: "Blog post",
  Resource: "Resource",
  User: "User",
};

/**
 * Debounced global search across every content type.
 *
 * Queries go through a server action rather than a JSON route, so the browser
 * holds no admin API surface. A sequence counter discards a slow earlier
 * response that would otherwise overwrite a newer one.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Monotonic request id. A server action cannot be aborted, so staleness is
  // detected here instead of through AbortController.
  const requestIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // The keyboard-highlighted result. This drives rendering, so it is state
  // rather than a ref: a ref read during render would not repaint on change.
  const [activeIndex, setActiveIndex] = useState(-1);

  const term = query.trim();
  const isSearchable = term.length >= MIN_CHARS;

  // A query too short to search shows no results. Clearing during render avoids
  // an effect-time state update, and keeps the previous hits from lingering
  // behind a dropdown that is about to close.
  const [lastSearchable, setLastSearchable] = useState(isSearchable);
  if (isSearchable !== lastSearchable) {
    setLastSearchable(isSearchable);
    if (!isSearchable) {
      setHits([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isSearchable) return;

    const timer = setTimeout(async () => {
      // Set inside the debounce so the spinner appears only once the request is
      // actually going out, not for every keystroke.
      setLoading(true);
      const requestId = ++requestIdRef.current;

      const data = await searchAdminContent(term);
      // A newer keystroke has already superseded this request.
      if (requestId !== requestIdRef.current) return;

      setLoading(false);
      if ("error" in data) {
        setHits([]);
        return;
      }
      setHits(data.hits);
      setOpen(true);
      setActiveIndex(-1);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term, isSearchable]);

  // Close when focus leaves the search area.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function go(hit: AdminSearchHit) {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) return;

    // Read through the functional form so each keypress composes with the
    // previous one instead of closing over a stale value.
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[activeIndex] ?? hits[0];
      if (hit) go(hit);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <label htmlFor="admin-global-search" className="sr-only">
        Search all content
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="admin-global-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search scholarships, universities, users..."
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="admin-search-results"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {open && query.trim().length >= MIN_CHARS ? (
        <div
          id="admin-search-results"
          role="listbox"
          className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {hits.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              No matches for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            hits.map((hit, index) => (
              <button
                key={`${hit.entity}-${hit.id}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => go(hit)}
                onMouseEnter={() => {
                  setActiveIndex(index);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  index === activeIndex ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {ENTITY_LABEL[hit.entity]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {hit.title}
                  </span>
                  <span className="block truncate text-xs text-slate-500">{hit.subtitle}</span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
