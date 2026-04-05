import React from "react";

const FileUpload = ({
  label,
  hint,
  fileName,
  required = false,
  accept,
  onChange,
}) => {
  return (
    <div className="field-group">
      {label ? <label className="field-label">{label}</label> : null}
      <label className="upload-field cursor-pointer">
        <span>{fileName || "Choisir un fichier"}</span>
        <span className="badge badge-neutral">
          {required ? "Requis" : hint || "Optionnel"}
        </span>
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default FileUpload;
