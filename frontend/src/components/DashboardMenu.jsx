import React from "react";

const DashboardMenu = ({ items, selectedItemId, onSelect }) => {
  return (
    <div className="panel-section p-3 sm:p-4">
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
