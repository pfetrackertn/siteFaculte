import React from "react";
import { MdOutlineDeleteForever } from "react-icons/md";
import CustomButton from "./CustomButton";

const DeleteConfirm = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <MdOutlineDeleteForever className="text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Confirmer la suppression
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {message ||
            "Voulez-vous vraiment supprimer cet element ? Cette action est irreversible."}
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <CustomButton onClick={onClose} variant="secondary">
            Annuler
          </CustomButton>
          <CustomButton onClick={onConfirm} variant="danger">
            Supprimer
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirm;
