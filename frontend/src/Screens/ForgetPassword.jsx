import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import CustomButton from "../components/CustomButton";
import BrandMark from "../components/BrandMark";
import { getUserTypeLabel } from "../utils/displayText";

const USER_TYPES = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ADMIN: "Admin",
};

const UserTypeSelector = ({ selected, onSelect }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {Object.values(USER_TYPES).map((type) => (
      <button
        key={type}
        onClick={() => onSelect(type)}
        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-200 ${
          selected === type
            ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {getUserTypeLabel(type)}
      </button>
    ))}
  </div>
);

const ForgetPassword = () => {
  const navigate = useNavigate();
  const userToken = localStorage.getItem("userToken");
  const [selected, setSelected] = useState(USER_TYPES.STUDENT);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (userToken) {
      navigate(`/${localStorage.getItem("userType")}`);
    }
  }, [userToken, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    toast.loading("Envoi du lien de reinitialisation...");

    if (email === "") {
      toast.dismiss();
      toast.error("Veuillez saisir votre adresse e-mail");
      return;
    }

    try {
      const resp = await axiosWrapper.post(
        `/${selected.toLowerCase()}/forget-password`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.dismiss();
      if (resp.data.success) {
        toast.success(resp.data.message);
      } else {
        toast.error(resp.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'envoi du lien de reinitialisation"
      );
    } finally {
      setEmail("");
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
              subtitle="Recuperation securisee des acces ISC-KIN"
            />
            <h1 className="mt-10 max-w-lg text-4xl font-extrabold tracking-tight sm:text-5xl">
              Recuperez rapidement l'acces a votre espace.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-100 sm:text-base">
              Selectionnez votre type de compte, saisissez votre adresse e-mail
              et recevez un lien de reinitialisation dans un environnement
              officiel ISC-KIN.
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
                    Assistance compte
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    Acces officiel ISC-KIN
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Recuperation du compte
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Mot de passe oublie
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Choisissez le type de compte concerne puis saisissez l'adresse
              e-mail pour recevoir un lien de reinitialisation.
            </p>

            <div className="mt-6 rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,248,220,0.85),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_48px_-36px_rgba(245,158,11,0.45)]">
              <BrandMark compact subtitle="Support d'acces ISC-KIN" />
            </div>

            <div className="mt-8">
              <UserTypeSelector selected={selected} onSelect={setSelected} />
            </div>

            <form
              onSubmit={onSubmit}
              className="mt-8 space-y-5 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  E-mail {getUserTypeLabel(selected).toLowerCase()}
                </label>
                <input
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  required
                  placeholder="adresse@email.com"
                />
              </div>
              <CustomButton type="submit" className="w-full py-3 text-base">
                Envoyer le lien de reinitialisation
              </CustomButton>
            </form>
          </div>
        </section>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default ForgetPassword;
