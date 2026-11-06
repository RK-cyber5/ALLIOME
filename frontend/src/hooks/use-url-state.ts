"use client";

/**
 * Sync a piece of state to a URL query parameter (shareable links).
 *
 * - Reads the initial value from the URL on first render.
 * - Updates the URL via `history.replaceState` whenever the value changes
 *   (no SPA navigation, no scroll jump, no extra history entries).
 * - Skips empty / "default" values so the URL stays clean.
 *
 * Designed for filter/sort state on listing pages where shareable URLs add
 * real value (discovery, portfolio filters, etc.).
 */

import { useCallback, useEffect, useState } from "react";

export function useUrlState(
  key: string,
  defaultValue: string,
): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") return defaultValue;
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? defaultValue;
  });

  // Keep the URL in sync. replaceState avoids polluting browser history.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value === defaultValue || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    const newSearch = url.search ? `?${url.searchParams.toString()}` : "";
    const newPath = `${url.pathname}${newSearch}${url.hash}`;
    if (newPath !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", newPath);
    }
  }, [key, value, defaultValue]);

  // If the user navigates back/forward, re-read from the URL.
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      setValue(params.get(key) ?? defaultValue);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [key, defaultValue]);

  return [value, setValue];
}

/** Boolean version — treats presence of the param as `true`. */
export function useUrlFlag(key: string, defaultValue = false): [boolean, (v: boolean) => void] {
  const [raw, setRaw] = useUrlState(key, defaultValue ? "1" : "");
  const value = raw === "1";
  const setter = useCallback(
    (v: boolean) => setRaw(v ? "1" : ""),
    [setRaw],
  );
  return [value, setter];
}
