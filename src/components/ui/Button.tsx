import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2 py-1 text-[11px] gap-1',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs gap-2',
    lg: 'px-4 py-2.5 text-sm gap-2',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 active:scale-[0.98]',
    secondary:
      'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 active:scale-[0.98]',
    danger:
      'bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 active:scale-[0.98]',
    ghost:
      'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:scale-[0.98]',
    icon:
      'p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg active:scale-[0.98]',
  };

  return (
    <button
      className={`${baseStyles} ${variant !== 'icon' ? sizeStyles[size] : ''} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
