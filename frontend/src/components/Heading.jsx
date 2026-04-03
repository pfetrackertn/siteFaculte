import React from "react";

const Heading = ({ title, subtitle }) => {
  return (
    <div className="mb-2 flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="hidden rounded-[26px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,249,219,0.95),rgba(255,255,255,0.96))] px-4 py-3 shadow-[0_18px_42px_-34px_rgba(245,158,11,0.45)] lg:flex lg:items-center lg:gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.3)]">
          <img
            src="/assets/isc-kin-logo.svg"
            alt="Logo ISC-KIN"
            className="h-9 w-9 object-contain"
          />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Plateforme officielle
          </p>
          <p className="mt-1 text-sm font-extrabold tracking-[0.14em] text-slate-900">
            ISC-KIN
          </p>
        </div>
      </div>
    </div>
  );
};

export default Heading;
