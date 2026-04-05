import React from "react";

const DashboardCard = ({ label, value, tone = "neutral", className = "" }) => {
  const toneClasses = {
    primary: "rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3",
    neutral: "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3",
    success: "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3",
    warning: "rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3",
  };

  const labelClasses = {
    primary: "text-blue-600",
    neutral: "text-slate-500",
    success: "text-emerald-700",
    warning: "text-amber-700",
  };

  return (
    <div className={`${toneClasses[tone] || toneClasses.neutral} ${className}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-[0.16em] ${
          labelClasses[tone] || labelClasses.neutral
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
};

export default DashboardCard;
