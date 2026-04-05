import React, { useState, useEffect } from "react";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiLogIn,
  FiShield,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { setUserToken } from "../redux/actions";
import { useDispatch } from "react-redux";
import CustomButton from "../components/CustomButton";
import axiosWrapper from "../utils/AxiosWrapper";
import BrandMark from "../components/BrandMark";
import { getUserTypeLabel } from "../utils/displayText";

const USER_TYPES = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ADMIN: "Admin",
};

const USER_DESCRIPTIONS = {
  Student: "Consultez vos notes, ressources et annonces en quelques clics.",
  Faculty: "Gerez vos ressources, emplois du temps et evaluations depuis un seul espace.",
  Admin: "Pilotez les etudiants, enseignants, filieres, matieres et examens.",
};

const USER_ICONS = {
  Student: FiBookOpen,
  Faculty: FiBriefcase,
  Admin: FiShield,
};

const LoginForm = ({ selected, onSubmit, formData, setFormData }) => (
  <form className="space-y-5" onSubmit={onSubmit}>
    <div>
      <label
        className="mb-2 block text-sm font-semibold text-slate-700"
        htmlFor="email"
      >
        E-mail {getUserTypeLabel(selected).toLowerCase()}
      </label>
      <input
        type="email"
        id="email"
        required
        placeholder="adresse@email.com"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </div>

    <div>
      <label
        className="mb-2 block text-sm font-semibold text-slate-700"
        htmlFor="password"
      >
        Mot de passe
      </label>
      <input
        type="password"
        id="password"
        required
        placeholder="Votre mot de passe"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
    </div>

    <div className="flex items-center justify-between gap-4 pt-1">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
        to="/forget-password"
      >
        Mot de passe oublie ?
        <FiArrowRight className="text-sm" />
      </Link>
    </div>

    <CustomButton
      type="submit"
      className="w-full py-3 text-base"
    >
      Se connecter
      <FiLogIn className="text-lg" />
    </CustomButton>
  </form>
);

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

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [selected, setSelected] = useState(USER_TYPES.STUDENT);

  const handleUserTypeSelect = (userType) => {
    setSelected(userType);
    setSearchParams({ type: userType.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await axiosWrapper.post(
        `/${selected.toLowerCase()}/login`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { token } = response.data.data;
      localStorage.setItem("userToken", token);
      localStorage.setItem("userType", selected);
      dispatch(setUserToken(token));
      toast.success("Connexion reussie");
      navigate(`/${selected.toLowerCase()}`);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Echec de la connexion");
    }
  };

  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    const userType = localStorage.getItem("userType");

    if (userToken && userType) {
      navigate(`/${userType.toLowerCase()}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (type) {
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      if (Object.values(USER_TYPES).includes(capitalizedType)) {
        setSelected(capitalizedType);
      }
    }
  }, [type]);

  return (
    <div className="page-shell flex min-h-screen items-center py-10">
      <div className="grid w-full overflow-hidden rounded-[36px] border border-white/70 bg-white/85 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0f4c81_0%,#1270bf_48%,#f5d94f_100%)] px-8 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(247,223,55,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.22),transparent_28%)]" />
          <div className="relative flex h-full flex-col">
            <BrandMark
              theme="dark"
              subtitle="Plateforme numerique de gestion universitaire"
            />

            <div className="mt-8 max-w-xl rounded-[30px] border border-white/16 bg-white/10 px-5 py-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Repere rapide
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-100/95 sm:text-[15px]">
                Choisissez votre profil pour acceder rapidement a votre espace
                et retrouver les services adaptes a votre activite.
              </p>
            </div>

            <div className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Acces par role
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {Object.values(USER_TYPES).map((userType) => {
                  const Icon = USER_ICONS[userType];

                  return (
                    <button
                      key={userType}
                      type="button"
                      onClick={() => handleUserTypeSelect(userType)}
                      className={`rounded-3xl border p-5 text-left shadow-inner shadow-black/10 backdrop-blur-sm transition duration-200 ${
                        selected === userType
                          ? "border-white/40 bg-white/22"
                          : "border-white/15 bg-white/12 hover:border-white/30 hover:bg-white/18"
                      }`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18 text-white">
                        <Icon className="text-lg" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-white">
                        {getUserTypeLabel(userType)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-100/90">
                        {USER_DESCRIPTIONS[userType]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        <section className="px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Espace securise
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Connexion {getUserTypeLabel(selected)}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {USER_DESCRIPTIONS[selected]}
            </p>

            <div className="mt-6 rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,248,220,0.85),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_48px_-36px_rgba(245,158,11,0.45)]">
              <BrandMark compact subtitle="Campus digital ISC-KIN" />
            </div>

            <div className="mt-8">
              <UserTypeSelector
                selected={selected}
                onSelect={handleUserTypeSelect}
              />
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <LoginForm
                selected={selected}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          </div>
        </section>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default Login;
