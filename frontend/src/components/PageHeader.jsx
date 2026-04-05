import React from "react";
import Heading from "./Heading";

const PageHeader = ({ title, subtitle, action, className = "" }) => {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <Heading title={title} subtitle={subtitle} />
      {action ? <div className="self-start sm:self-auto">{action}</div> : null}
    </div>
  );
};

export default PageHeader;
