import React from "react";

const THEMES = {
  light: {
    eyebrow: "text-slate-500",
    title: "text-slate-950",
    subtitle: "text-slate-500",
    logoShell: "bg-white/90 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.5)]",
  },
  dark: {
    eyebrow: "text-white/70",
    title: "text-white",
    subtitle: "text-slate-200/80",
    logoShell: "bg-white shadow-[0_24px_50px_-26px_rgba(15,23,42,0.65)]",
  },
};

const BrandMark = ({
  theme = "light",
  compact = false,
  className = "",
  subtitle = "Plateforme academique",
}) => {
  const palette = THEMES[theme] || THEMES.light;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-[28px] border border-white/70 p-2 ${
          compact ? "h-14 w-14" : "h-20 w-20"
        } ${palette.logoShell}`}
      >
        <img
          src="/assets/isc-kin-logo.svg"
          alt="Logo ISC-KIN"
          className={`object-contain ${compact ? "h-10 w-10" : "h-14 w-14"}`}
        />
      </div>

      <div>
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${palette.eyebrow}`}
        >
          Institution
        </p>
        <p
          className={`font-black tracking-tight ${palette.title} ${
            compact ? "text-lg sm:text-xl" : "text-3xl sm:text-4xl"
          }`}
        >
          ISC-KIN
        </p>
        {subtitle ? (
          <p
            className={`mt-1 max-w-md text-sm leading-6 ${palette.subtitle}`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default BrandMark;
