import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import CustomButton from "../components/CustomButton";
import BrandMark from "../components/BrandMark";

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
    <div className="page-shell flex min-h-screen items-center justify-center py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/70 bg-white/88 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(145deg,#0f4c81_0%,#1270bf_52%,#f5d94f_100%)] px-8 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(247,223,55,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.18),transparent_28%)]" />
          <div className="relative">
            <BrandMark
              theme="dark"
              subtitle="Protection renforcee des comptes ISC-KIN"
            />
            <h1 className="mt-10 max-w-lg text-4xl font-extrabold tracking-tight sm:text-5xl">
              Definissez un nouveau mot de passe en toute securite.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-100 sm:text-base">
              Choisissez un mot de passe fort pour proteger durablement votre
              espace personnel, enseignant ou administratif sur la plateforme
              ISC-KIN.
            </p>

            <div className="mt-10 rounded-[30px] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/92 p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.7)]">
                  <img
                    src="/assets/isc-kin-logo.svg"
                    alt="Logo ISC-KIN"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                    Securite
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    Reinitialisation officielle ISC-KIN
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Securite du compte
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Modifier le mot de passe
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Saisissez un nouveau mot de passe fort et confirmez-le pour
              terminer la reinitialisation.
            </p>

            <div className="mt-6 rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,248,220,0.85),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_48px_-36px_rgba(245,158,11,0.45)]">
              <BrandMark compact subtitle="Securite des comptes ISC-KIN" />
            </div>

            <form
              onSubmit={onSubmit}
              className="mt-8 space-y-5 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  value={newPassword}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                  required
                />
              </div>

              <CustomButton
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-base"
              >
                {isLoading
                  ? "Reinitialisation..."
                  : "Reinitialiser le mot de passe"}
              </CustomButton>
            </form>
          </div>
        </section>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default UpdatePassword;
