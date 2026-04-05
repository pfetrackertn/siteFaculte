import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { IoMdClose } from "react-icons/io";
import axiosWrapper from "../utils/AxiosWrapper";
import CustomButton from "./CustomButton";

const UpdatePasswordLoggedIn = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const userToken = localStorage.getItem("userToken");
  const userType = localStorage.getItem("userType");

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosWrapper.post(
        `/${userType.toLowerCase()}/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Mot de passe mis a jour avec succes");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Impossible de mettre a jour le mot de passe"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="modal-backdrop">
      <div className="modal-card max-w-lg">
        <div className="modal-header">
          <div>
            <p className="section-kicker">
              Securite du compte
            </p>
            <h2 className="section-title">
              Modifier le mot de passe
            </h2>
          </div>
          <CustomButton
            onClick={onClose}
            variant="secondary"
            className="!rounded-xl !p-2"
          >
            <IoMdClose className="text-2xl" />
          </CustomButton>
        </div>

        <form onSubmit={handlePasswordUpdate}>
          <div className="modal-body space-y-5">
            <div className="field-group">
              <label className="field-label">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            </div>
            <div className="field-group">
              <label className="field-label">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            </div>
            <div className="field-group">
              <label className="field-label">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            </div>
          </div>
          <div className="modal-footer">
            <CustomButton type="button" variant="secondary" onClick={onClose}>
              Annuler
            </CustomButton>
            <CustomButton type="submit" disabled={isLoading}>
              {isLoading ? "Mise a jour..." : "Enregistrer"}
            </CustomButton>
          </div>
        </form>
      </div>
    </section>
  );
};

export default UpdatePasswordLoggedIn;
