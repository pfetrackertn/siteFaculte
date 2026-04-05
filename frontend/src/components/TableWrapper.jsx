import React from "react";

const TableWrapper = ({ title, subtitle, toolbar, className = "", children }) => {
  return (
    <div className={`table-shell ${className}`}>
      {title || subtitle || toolbar ? (
        <div className="table-toolbar">
          <div className="section-header">
            {title ? <h2 className="section-title">{title}</h2> : null}
            {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
          </div>
          {toolbar ? <div>{toolbar}</div> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
};

export default TableWrapper;
