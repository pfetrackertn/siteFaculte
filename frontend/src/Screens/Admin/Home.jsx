import React, { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  PiBuildings,
  PiChalkboardTeacher,
  PiExam,
  PiFolders,
  PiMegaphone,
  PiShieldCheck,
  PiStudent,
  PiUserCircleGear,
} from "react-icons/pi";
import { MdClass } from "react-icons/md";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import BrandMark from "../../components/BrandMark";
import DashboardMenu from "../../components/DashboardMenu";
import Loading from "../../components/Loading";
import axiosWrapper from "../../utils/AxiosWrapper";
import { setUserData } from "../../redux/actions";
import Admin from "./Admin";
import Branch from "./Branch";
import Classes from "./Class";
import Faculty from "./Faculty";
import Notice from "../Notice";
import Profile from "./Profile";
import Student from "./Student";
import Subjects from "./Subject";
import Exam from "../Exam";

const MENU_ITEMS = [
  {
    id: "home",
    label: "Profil",
    description: "Coordonnees et securite du compte",
    component: Profile,
    icon: PiUserCircleGear,
  },
  {
    id: "student",
    label: "Etudiants",
    description: "Recherche, ajout et edition",
    component: Student,
    icon: PiStudent,
  },
  {
    id: "faculty",
    label: "Enseignants",
    description: "Gestion des comptes enseignants",
    component: Faculty,
    icon: PiChalkboardTeacher,
  },
  {
    id: "branch",
    label: "Filieres",
    description: "Organisation academique",
    component: Branch,
    icon: PiBuildings,
  },
  {
    id: "class",
    label: "Classes",
    description: "Promotions et groupes",
    component: Classes,
    icon: MdClass,
  },
  {
    id: "subjects",
    label: "Matieres",
    description: "Semestres, credits et codes",
    component: Subjects,
    icon: PiFolders,
  },
  {
    id: "notice",
    label: "Annonces",
    description: "Communication interne",
    component: Notice,
    icon: PiMegaphone,
  },
  {
    id: "exam",
    label: "Examens",
    description: "Calendrier et documents",
    component: Exam,
    icon: PiExam,
  },
  {
    id: "admin",
    label: "Admins",
    description: "Roles et acces",
    component: Admin,
    icon: PiShieldCheck,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [profileData, setProfileData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const userToken = localStorage.getItem("userToken");

  const fetchUserDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      toast.loading("Chargement du profil...");
      const response = await axiosWrapper.get("/admin/my-details", {
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
    navigate(`/admin?page=${menuId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loading label="Preparation de votre espace administrateur..." />;
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
                Administration
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {profileData?.firstName
                  ? `Bienvenue, ${profileData.firstName}`
                  : "Tableau de bord administrateur"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Centralisez les comptes, les filieres, les classes, les
                annonces et les examens depuis une interface plus claire et plus
                rapide.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-3xl border border-amber-100 bg-[linear-gradient(135deg,rgba(255,250,214,0.92),rgba(255,255,255,0.96))] px-4 py-4 shadow-[0_18px_42px_-34px_rgba(245,158,11,0.45)]">
                <BrandMark compact subtitle="Campus digital ISC-KIN" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Role
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {profileData?.isSuperAdmin
                    ? "Super administrateur"
                    : "Administrateur"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Sections
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {MENU_ITEMS.length} modules disponibles
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
