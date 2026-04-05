import React from "react";

const FormRow = ({ className = "", children }) => {
  return <div className={`field-group ${className}`}>{children}</div>;
};

export default FormRow;
