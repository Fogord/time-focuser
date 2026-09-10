import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  monospace?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  monospace = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/40 transition-all ${
            leftIcon ? 'pl-9 pr-3.5' : 'px-3.5'
          } ${monospace ? 'font-mono' : ''} ${
            error ? 'border-red-500/80 focus:border-red-500' : ''
          } ${className}`}
          {...props}
        />
      </div>

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
};
