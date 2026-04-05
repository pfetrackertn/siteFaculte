import React from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.9)] hover:-translate-y-0.5 hover:from-blue-700 hover:via-blue-600 hover:to-sky-600",
  secondary:
    "border border-slate-200 bg-white/92 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50",
  danger:
    "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-[0_16px_30px_-18px_rgba(225,29,72,0.9)] hover:-translate-y-0.5 hover:from-rose-700 hover:to-red-600",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100",
};

const CustomButton = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary",
  title,
}) => {
  const variantClasses = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default CustomButton;
