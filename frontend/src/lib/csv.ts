/**
 * Lightweight CSV export utility.
 *
 * Escapes per RFC 4180: fields containing commas, quotes or newlines are
 * wrapped in double quotes with embedded quotes doubled.
 */

function escapeField(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(rows: Array<Record<string, unknown>>, columns: Array<{ key: string; header: string }>): string {
  const head = columns.map((c) => escapeField(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeField(row[c.key])).join(","))
    .join("\r\n");
  return `${head}\r\n${body}`;
}

/** Trigger a browser download of `csv` as a `.csv` file. */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Release the object URL on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
