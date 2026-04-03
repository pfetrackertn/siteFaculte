import React from "react";

const NoData = ({ title, description }) => {
  return (
    <div className="empty-state-panel my-12 flex flex-col items-center justify-center">
      <img
        src="/assets/empty.svg"
        alt="Aucune donnee"
        className="h-48 w-48 object-contain sm:h-56 sm:w-56"
      />
      <p className="mt-4 text-lg font-semibold text-slate-700">
        {title || "Aucune donnee disponible"}
      </p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description ||
          "Aucun resultat ne correspond a votre recherche pour le moment."}
      </p>
    </div>
  );
};

export default NoData;
