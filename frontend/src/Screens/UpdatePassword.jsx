import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import CustomButton from "../components/CustomButton";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { resetId, type } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!resetId) {
      toast.error("Lien de reinitialisation invalide ou expire.");
      navigate("/");
    }
  }, [resetId, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!type) {
      toast.error("Lien de reinitialisation invalide.");
      return;
    }
    setIsLoading(true);
    toast.loading("Reinitialisation du mot de passe...");

    try {
      const response = await axiosWrapper.post(
        `/${type}/update-password/${resetId}`,
        { password: newPassword, resetId }
      );

      toast.dismiss();
      if (response.data.success) {
        toast.success("Mot de passe reinitialise avec succes.");
        navigate("/");
      } else {
        toast.error(
          response.data.message ||
            "Erreur lors de la reinitialisation du mot de passe."
        );
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la reinitialisation du mot de passe."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl lg:w-1/2 px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
          Modifier le mot de passe
        </h1>
        <form
          className="w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-200"
          onSubmit={onSubmit}
        >
          <div className="mb-6">
            <label
              className="block text-gray-800 text-sm font-medium mb-2"
              htmlFor="newPassword"
            >
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="newPassword"
              onChange={(e) => setNewPassword(e.target.value)}
              value={newPassword}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-800 text-sm font-medium mb-2"
              htmlFor="confirmPassword"
            >
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <CustomButton
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200"
          >
            {isLoading
              ? "Reinitialisation..."
              : "Reinitialiser le mot de passe"}
          </CustomButton>
        </form>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default UpdatePassword;
