import React from "react";

const InfoItem = ({ label, value, className = "" }) => {
  return (
    <div className={`detail-item ${className}`}>
      <p className="detail-label">{label}</p>
      <p className="detail-value">{value || "Non renseigne"}</p>
    </div>
  );
};

export default InfoItem;
