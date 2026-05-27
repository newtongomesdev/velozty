import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "volt" | "pink" | "glass" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "volt",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle = "relative inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-darkbg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variantStyles = {
    volt: "bg-volt text-black hover:bg-white border border-transparent shadow-[0_0_15px_rgba(198,255,0,0.3)] hover:shadow-[0_0_25px_rgba(198,255,0,0.6)] focus:ring-volt",
    pink: "bg-hyperpink text-white hover:bg-pink-400 border border-transparent shadow-[0_0_15px_rgba(255,43,214,0.3)] hover:shadow-[0_0_25px_rgba(255,43,214,0.6)] focus:ring-hyperpink",
    glass: "bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-md hover:border-white/20 focus:ring-white",
    danger: "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 focus:ring-red-500",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          PROCESSANDO...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
