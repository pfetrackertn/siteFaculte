import React from "react";
import { MdOutlineDeleteForever } from "react-icons/md";
import CustomButton from "./CustomButton";

const DeleteConfirm = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <MdOutlineDeleteForever className="text-3xl" />
            </div>
            <div>
              <h3 className="section-title">
                {title || "Confirmer la suppression"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {message ||
                  "Voulez-vous vraiment supprimer cet element ? Cette action est irreversible."}
              </p>
            </div>
          </div>
          <CustomButton onClick={onClose} variant="secondary">
            Annuler
          </CustomButton>
        </div>
        <div className="modal-footer">
          <CustomButton onClick={onConfirm} variant="danger">
            {confirmLabel || "Supprimer"}
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirm;
