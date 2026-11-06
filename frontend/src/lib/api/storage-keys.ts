/**
 * ALLIOME storage key migration.
 *
 * The product was renamed from PartnerPilot to ALLIOME. To avoid silently
 * orphaning in-progress investigations stored under the old `pp.*` keys,
 * we one-shot migrate them to the new `alliome.*` namespace on first load.
 *
 * Safe to call repeatedly — it no-ops once the new keys exist.
 */

export const STORAGE_KEYS = {
  workspace: "alliome.workspace",
  mockRuns: "alliome.mock-runs",
  mockSimulate: "alliome.mock-simulate",
} as const;

const MIGRATIONS: Array<[string, string]> = [
  ["pp.workspace", STORAGE_KEYS.workspace],
  ["pp.mock-runs", STORAGE_KEYS.mockRuns],
  ["pp.mock-simulate", STORAGE_KEYS.mockSimulate],
];

let migrated = false;

export function migrateStorageKeys(): void {
  if (migrated) return;
  if (typeof window === "undefined") return;
  try {
    for (const [oldKey, newKey] of MIGRATIONS) {
      if (localStorage.getItem(newKey) == null) {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue != null) {
          localStorage.setItem(newKey, oldValue);
          localStorage.removeItem(oldKey);
        }
      } else {
        // New key already exists — clear any stale old key.
        localStorage.removeItem(oldKey);
      }
    }
  } catch {
    /* localStorage unavailable — in-memory only */
  }
  migrated = true;
}
