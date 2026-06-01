"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";

import { COUNTRIES } from "@/lib/countries";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function useOutsideClose(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onClose]);
}

function filterCountries(query: string, exclude: readonly string[] = []) {
  const q = query.trim().toLowerCase();
  return COUNTRIES.filter(
    (c) => !exclude.includes(c) && (q === "" || c.toLowerCase().includes(q))
  );
}

/* ── Single-select searchable country picker ──────────────────────────── */

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select a country",
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useOutsideClose(wrapRef, () => setOpen(false));

  const results = useMemo(() => filterCountries(query), [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const select = (c: string) => {
    onChange(c);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 text-left text-sm outline-none transition-colors hover:bg-secondary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30"
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center gap-2 border-b border-border/60 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (results[0]) select(results[0]);
                }
              }}
              placeholder="Search countries…"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No countries found</li>
            ) : (
              results.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => select(c)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      c === value && "font-medium"
                    )}
                  >
                    {c}
                    {c === value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Multi-select searchable country picker (with removable chips) ────── */

export function CountryMultiSelect({
  values,
  onChange,
  placeholder = "Search and add a country…",
  className,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useOutsideClose(wrapRef, () => setOpen(false));

  const results = useMemo(() => filterCountries(query, values), [query, values]);

  const add = (c: string) => {
    if (!values.includes(c)) onChange([...values, c]);
    setQuery("");
    inputRef.current?.focus();
  };
  const remove = (c: string) => onChange(values.filter((v) => v !== c));

  return (
    <div className={cn("relative", className)}>
      <div ref={wrapRef} className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 transition-colors focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/30">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                if (results[0]) add(results[0]);
              }
              if (e.key === "Backspace" && query === "" && values.length) {
                remove(values[values.length - 1]);
              }
            }}
            placeholder={placeholder}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
            <ul className="max-h-60 overflow-y-auto p-1">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {query.trim() ? "No countries found" : "All countries added"}
                </li>
              ) : (
                results.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => add(c)}
                      className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {c}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((c) => (
            <Badge
              key={c}
              variant="secondary"
              className="flex items-center gap-1.5 rounded-full border border-border/40 py-1 pr-1.5 pl-3 text-xs font-medium"
            >
              {c}
              <button
                type="button"
                onClick={() => remove(c)}
                className="opacity-70 transition-colors hover:text-destructive hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
