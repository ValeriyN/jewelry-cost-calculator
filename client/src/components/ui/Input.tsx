import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-surface-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 text-base sm:text-sm rounded-xl border bg-surface-700 text-surface-100
            focus:outline-none focus:border-primary-400
            placeholder:text-surface-400
            disabled:bg-surface-800 disabled:text-surface-500
            ${error ? "border-red-400" : "border-surface-600"}
            ${className}
          `}
          {...props}
        />
        {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
