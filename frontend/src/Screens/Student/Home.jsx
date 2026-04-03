import React, { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  PiBookOpenText,
  PiCalendarBlank,
  PiExam,
  PiMegaphone,
  PiStudent,
  PiTrendUp,
} from "react-icons/pi";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import BrandMark from "../../components/BrandMark";
import DashboardMenu from "../../components/DashboardMenu";
import Loading from "../../components/Loading";
import axiosWrapper from "../../utils/AxiosWrapper";
import { setUserData } from "../../redux/actions";
import Exam from "../Exam";
import Notice from "../Notice";
import Material from "./Material";
import Profile from "./Profile";
import Timetable from "./Timetable";
import ViewMarks from "./ViewMarks";
import { getAcademicClassLabel } from "../../utils/displayText";

const MENU_ITEMS = [
  {
    id: "home",
    label: "Profil",
    description: "Vos informations personnelles",
    component: null,
    icon: PiStudent,
  },
  {
    id: "timetable",
    label: "Emploi du temps",
    description: "Consulter vos horaires",
    component: Timetable,
    icon: PiCalendarBlank,
  },
  {
    id: "material",
    label: "Ressources",
    description: "Support de cours et documents",
    component: Material,
    icon: PiBookOpenText,
  },
  {
    id: "notice",
    label: "Annonces",
    description: "Informations importantes",
    component: Notice,
    icon: PiMegaphone,
  },
  {
    id: "exam",
    label: "Examens",
    description: "Calendrier des evaluations",
    component: Exam,
    icon: PiExam,
  },
  {
    id: "marks",
    label: "Notes",
    description: "Resultats par semestre",
    component: ViewMarks,
    icon: PiTrendUp,
  },
];

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [profileData, setProfileData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const userToken = localStorage.getItem("userToken");
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      toast.loading("Chargement du profil...");
      const response = await axiosWrapper.get("/student/my-details", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setProfileData(response.data.data);
        dispatch(setUserData(response.data.data));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des informations utilisateur"
      );
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  }, [dispatch, userToken]);

  useEffect(() => {
    if (userToken) {
      fetchUserDetails();
    } else {
      navigate("/");
    }
  }, [fetchUserDetails, navigate, userToken]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const pathMenuId = urlParams.get("page") || "home";
    const validMenu = MENU_ITEMS.find((item) => item.id === pathMenuId);
    setSelectedMenu(validMenu ? validMenu.id : "home");
  }, [location.pathname, location.search]);

  const handleMenuClick = (menuId) => {
    setSelectedMenu(menuId);
    navigate(`/student?page=${menuId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loading label="Chargement de votre espace etudiant..." />;
    }

    if (selectedMenu === "home" && profileData) {
      return <Profile profileData={profileData} />;
    }

    const MenuItem = MENU_ITEMS.find(
      (item) => item.id === selectedMenu
    )?.component;

    return MenuItem ? <MenuItem /> : null;
  };

  return (
    <>
      <Navbar />
      <div className="page-shell space-y-6 py-6 sm:py-8">
        <section className="panel-section overflow-hidden px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Espace etudiant
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {profileData?.firstName
                  ? `Bonjour ${profileData.firstName}`
                  : "Votre espace d'apprentissage"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Retrouvez rapidement vos ressources, votre emploi du temps, vos
                examens, vos annonces et vos notes dans un seul endroit.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-3xl border border-amber-100 bg-[linear-gradient(135deg,rgba(255,250,214,0.92),rgba(255,255,255,0.96))] px-4 py-4 shadow-[0_18px_42px_-34px_rgba(245,158,11,0.45)]">
                <BrandMark compact subtitle="Experience etudiante ISC-KIN" />
              </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Filiere
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {profileData?.branchId?.name || "Non renseignee"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Semestre
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {profileData?.semester || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Classe
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {getAcademicClassLabel(profileData?.classId)}
                </p>
              </div>
            </div>
            </div>
          </div>
        </section>

        <DashboardMenu
          items={MENU_ITEMS}
          selectedItemId={selectedMenu}
          onSelect={handleMenuClick}
        />

        <section className="panel-section overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
          {renderContent()}
        </section>
      </div>
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;
