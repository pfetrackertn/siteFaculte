import React from "react";

const Heading = ({ title, subtitle }) => {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
};

export default Heading;
