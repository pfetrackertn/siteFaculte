import React from "react";

const PageContainer = ({ className = "", children }) => {
  return <div className={`screen-shell ${className}`}>{children}</div>;
};

export default PageContainer;
