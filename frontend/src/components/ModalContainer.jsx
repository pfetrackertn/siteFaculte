import React from "react";
import { IoMdClose } from "react-icons/io";
import CustomButton from "./CustomButton";

const ModalContainer = ({
  isOpen,
  title,
  subtitle,
  onClose,
  maxWidthClass = "max-w-3xl",
  bodyClassName = "",
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className={`modal-card ${maxWidthClass}`}>
        <div className="modal-header">
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
          </div>
          <CustomButton
            onClick={onClose}
            variant="secondary"
            className="!rounded-xl !p-2.5"
          >
            <IoMdClose className="text-2xl" />
          </CustomButton>
        </div>
        <div className={`modal-body ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
};

export default ModalContainer;
