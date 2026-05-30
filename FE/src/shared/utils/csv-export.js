export function downloadCsv(filename, csvContent) {
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsvRow(fields) {
  return fields.map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`).join(",");
}

export function buildCsv(headers, rows) {
  return [toCsvRow(headers), ...rows.map(toCsvRow)].join("\n");
}
