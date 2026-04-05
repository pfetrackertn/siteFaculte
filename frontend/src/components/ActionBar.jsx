import React from "react";

const ActionBar = ({ className = "", children }) => {
  return <div className={`action-bar ${className}`}>{children}</div>;
};

export default ActionBar;
