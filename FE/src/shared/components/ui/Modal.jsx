import React from "react";
import { X } from "lucide-react";

function ModalBody({ className = "", children }) {
  return (
    <div className={`p-6 overflow-y-auto flex-1 ${className}`}>
      {children}
    </div>
  );
}

function ModalFooter({ className = "", children }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-100 dark:border-gray-700 flex justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Base modal wrapper. Replaces 96+ copy-pasted modal patterns.
 * @param {boolean} open
 * @param {function} onClose
 * @param {string} title
 * @param {string} [subtitle]
 * @param {string} [maxWidth="max-w-lg"]
 * @param {string} [zIndex="z-[1000]"]
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "max-w-lg",
  zIndex = "z-[1000]",
  children,
}) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} border border-slate-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
