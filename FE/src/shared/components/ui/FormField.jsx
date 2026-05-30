import React from "react";

const BASE_INPUT =
  "w-full bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 outline-none " +
  "focus:ring-4 focus:ring-red-50 dark:focus:ring-red-900/20 font-medium " +
  "text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 " +
  "transition-all text-sm";

const BORDER_DEFAULT = "border-slate-200 dark:border-gray-600 focus:border-[#dc2626]";
const BORDER_ERROR = "border-red-400 focus:border-red-400";

const LABEL = "block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

/**
 * Reusable form field — input, select, or textarea.
 * @param {string} label
 * @param {*} value
 * @param {function} onChange
 * @param {string} [error]
 * @param {boolean} [required]
 * @param {"input"|"select"|"textarea"} [as="input"]
 * @param {string} [type="text"]
 * @param {string} [placeholder]
 * @param {boolean} [disabled]
 * @param {number} [rows] — textarea only
 * @param {ReactNode} [children] — select options
 * @param {string} [className]
 */
export default function FormField({
  label,
  value,
  onChange,
  error,
  required = false,
  as = "input",
  type = "text",
  placeholder,
  disabled = false,
  rows,
  children,
  className,
}) {
  const borderClass = error ? BORDER_ERROR : BORDER_DEFAULT;
  const inputClass = className ?? `${BASE_INPUT} ${borderClass}`;

  const sharedProps = {
    value,
    onChange,
    disabled,
    placeholder,
    className: inputClass,
  };

  let field;
  if (as === "textarea") {
    field = <textarea {...sharedProps} rows={rows ?? 3} />;
  } else if (as === "select") {
    field = (
      <select {...sharedProps}>
        {children}
      </select>
    );
  } else {
    field = <input {...sharedProps} type={type} />;
  }

  return (
    <div>
      {label && (
        <label className={LABEL}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {field}
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
}
