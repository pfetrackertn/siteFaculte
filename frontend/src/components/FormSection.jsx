import React from "react";
import SectionCard from "./SectionCard";

const FormSection = ({ title, subtitle, className = "", children }) => {
  return (
    <SectionCard className={`px-6 py-6 ${className}`}>
      {title || subtitle ? (
        <div className="section-header">
          {title ? <h3 className="section-title">{title}</h3> : null}
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
      ) : null}
      <div className={title || subtitle ? "mt-5" : ""}>{children}</div>
    </SectionCard>
  );
};

export default FormSection;
