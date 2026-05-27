import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "volt" | "pink" | "none";
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = "none",
  hoverable = false,
  className = "",
  ...props
}) => {
  const baseStyle = "bg-neoncard/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 overflow-hidden";
  
  const glowStyles = {
    volt: "border-volt/30 shadow-[0_0_15px_rgba(198,255,0,0.1)] hover:border-volt/50 hover:shadow-[0_0_25px_rgba(198,255,0,0.25)]",
    pink: "border-hyperpink/30 shadow-[0_0_15px_rgba(255,43,214,0.1)] hover:border-hyperpink/50 hover:shadow-[0_0_25px_rgba(255,43,214,0.25)]",
    none: "",
  };

  const hoverStyle = hoverable 
    ? "transform hover:-translate-y-1 hover:bg-neoncard/95 hover:border-white/20 cursor-pointer" 
    : "";

  return (
    <div
      className={`${baseStyle} ${glowStyles[glow]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`mb-4 border-b border-white/5 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-bold tracking-wider text-white uppercase ${className}`} {...props}>
    {children}
  </h3>
);
