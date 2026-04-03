import React from "react";

const DashboardMenu = ({ items, selectedItemId, onSelect }) => {
  return (
    <div className="panel-section p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,245,255,0.92))] px-4 py-4 shadow-[0_18px_42px_-34px_rgba(37,99,235,0.28)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Navigation rapide
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Accedez rapidement aux modules essentiels de la plateforme ISC-KIN.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white/90 px-3 py-2 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,242,145,0.45),rgba(255,255,255,0.98))]">
            <img
              src="/assets/isc-kin-logo.svg"
              alt="Logo ISC-KIN"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              ISC-KIN
            </p>
            <p className="text-sm font-bold text-slate-900">
              {items.length} modules disponibles
            </p>
          </div>
        </div>
      </div>
      <div className="dashboard-menu">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = selectedItemId === item.id;

          return (
            <button
              key={item.id}
              className={`dashboard-menu-button ${isActive ? "is-active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {Icon ? <Icon className="text-xl" /> : null}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isActive ? "text-white" : "text-slate-800"
                  }`}
                >
                  {item.label}
                </p>
                {item.description ? (
                  <p
                    className={`mt-1 text-xs ${
                      isActive ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    {item.description}
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardMenu;
