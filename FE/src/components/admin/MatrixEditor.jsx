import React from "react";
import { SEAT_TYPES } from "../../shared/constants";

const typeColor = (type) =>
  SEAT_TYPES.find((t) => t.value === type)?.color || "bg-slate-200";

// Click a cell to cycle through seat types.
// roomType controls which types are available for cycling.
const MatrixEditor = ({ matrix, onChange, roomType = "Standard" }) => {
  const cycleType = (ri, ci) => {
    const allTypes = ["normal", "vip", "couple", "aisle"];
    const forbidden = roomType === "Standard" ? new Set(["vip"]) : new Set();
    const order = allTypes.filter((t) => !forbidden.has(t));

    const current = matrix[ri][ci]?.type || "normal";
    const idx = order.indexOf(current);
    const next = idx >= 0 ? order[(idx + 1) % order.length] : order[0];

    const updated = matrix.map((row, r) => {
      if (r !== ri) return row;
      const newRow = row.map((cell, c) =>
        c === ci ? { ...cell, type: next } : cell,
      );
      // Relabel: non-aisle seats get sequential numbers, aisle cells keep row letter only
      const rowLetter = String.fromCharCode(65 + r);
      let seatNum = 1;
      return newRow.map((cell) => ({
        ...cell,
        label: cell.type === "aisle" ? rowLetter : `${rowLetter}${seatNum++}`,
      }));
    });
    onChange(updated);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Screen indicator */}
        <div className="w-full h-6 bg-slate-200 dark:bg-slate-600 rounded mb-4 flex items-center justify-center text-slate-400 dark:text-slate-400 text-xs font-bold tracking-widest uppercase">
          Màn hình
        </div>
        {matrix.map((row, ri) => (
          <div key={ri} className="flex gap-1 mb-1 items-center">
            <span className="w-5 text-xs text-slate-400 font-bold text-center">
              {row[0]?.label?.[0] || ""}
            </span>
            {row.map((cell, ci) => (
              <button
                key={ci}
                onClick={() => cycleType(ri, ci)}
                title={`${cell.label} → click để đổi loại`}
                className={`w-9 h-9 rounded text-[10px] font-bold border transition-all ${typeColor(cell.type)}`}
              >
                {cell.type === "aisle" ? "" : cell.label.replace(/^[A-Z]/, "")}
              </button>
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          {SEAT_TYPES.map((t) => (
            <div
              key={t.value}
              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
            >
              <div className={`w-5 h-5 rounded border ${t.color}`} />
              {t.label}
            </div>
          ))}
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
            Click vào ghế để đổi loại
          </span>
        </div>
      </div>
    </div>
  );
};

// Read-only matrix preview
export const MatrixView = ({ matrix }) => (
  <div className="overflow-x-auto">
    <div className="inline-block">
      <div className="h-5 bg-slate-200 dark:bg-slate-600 rounded mb-3 flex items-center justify-center text-slate-400 dark:text-slate-400 text-[10px] font-bold tracking-widest uppercase">
        Màn hình
      </div>
      {matrix.map((row, ri) => (
        <div key={ri} className="flex gap-1 mb-1 items-center">
          <span className="w-5 text-xs text-slate-400 font-bold text-center shrink-0">
            {row[0]?.label?.[0] || ""}
          </span>
          {row.map((cell, ci) => (
            <div
              key={ci}
              title={cell.label}
              className={`w-8 h-8 rounded text-[9px] font-bold border flex items-center justify-center select-none ${typeColor(cell.type)}`}
            >
              {cell.type === "aisle" ? "" : cell.label.replace(/^[A-Z]/, "")}
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
        {SEAT_TYPES.filter((t) => t.value !== "aisle").map((t) => (
          <div
            key={t.value}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
          >
            <div className={`w-4 h-4 rounded border ${t.color}`} />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MatrixEditor;
