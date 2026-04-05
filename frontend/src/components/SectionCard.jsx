import React from "react";

const SectionCard = ({ as: Tag = "section", className = "", children }) => {
  return <Tag className={`panel-section ${className}`}>{children}</Tag>;
};

export default SectionCard;
