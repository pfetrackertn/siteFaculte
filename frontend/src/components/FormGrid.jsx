import React from "react";

const FormGrid = ({ columns = "two", className = "", children }) => {
  const map = {
    two: "form-grid",
    three: "form-grid-3",
    filters: "filter-grid",
    filters2: "filter-grid-2",
    filters3: "filter-grid-3",
    filters5: "filter-grid-5",
  };

  return <div className={`${map[columns] || "form-grid"} ${className}`}>{children}</div>;
};

export default FormGrid;
