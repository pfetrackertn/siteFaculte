import React from "react";

const TONE_CLASSES = {
  primary: "badge badge-primary",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  neutral: "badge badge-neutral",
};

const StatusBadge = ({ children, tone = "neutral", className = "" }) => {
  return (
    <span className={`${TONE_CLASSES[tone] || TONE_CLASSES.neutral} ${className}`}>
      {children}
    </span>
  );
};

export default StatusBadge;
