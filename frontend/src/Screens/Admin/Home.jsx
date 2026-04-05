import React, { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  PiBooks,
  PiBuildings,
  PiCalendarBlank,
  PiChalkboardTeacher,
  PiExam,
  PiFolderOpen,
  PiFolders,
  PiMegaphone,
  PiMoney,
  PiShieldCheck,
  PiStudent,
  PiUserCircleGear,
} from "react-icons/pi";
import { MdClass } from "react-icons/md";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import DashboardMenu from "../../components/DashboardMenu";
import Loading from "../../components/Loading";
import axiosWrapper from "../../utils/AxiosWrapper";
import { setUserData } from "../../redux/actions";
import Admin from "./Admin";
import Branch from "./Branch";
import Classes from "./Class";
import Department from "./Department";
import Faculty from "./Faculty";
import Notice from "../Notice";
import Profile from "./Profile";
import Promotion from "./Promotion";
import Student from "./Student";
import Subjects from "./Subject";
import Exam from "../Exam";
import AcademicYear from "./AcademicYear";
import AcademicFees from "../AcademicFees";
import Library from "../Library";
import ArchiveCenter from "./ArchiveCenter";

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
    id: "department",
    label: "Departements",
    description: "Sections et rattachements",
    component: Department,
    icon: PiFolderOpen,
  },
  {
    id: "academic-year",
    label: "Annees",
    description: "Pilotage de l'annee active",
    component: AcademicYear,
    icon: PiCalendarBlank,
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
    id: "promotion",
    label: "Promotions",
    description: "Cohortes et parcours",
    component: Promotion,
    icon: PiStudent,
  },
  {
    id: "fees",
    label: "Frais",
    description: "Gestion financiere academique",
    component: AcademicFees,
    icon: PiMoney,
  },
  {
    id: "library",
    label: "Library",
    description: "Documents institutionnels",
    component: Library,
    icon: PiBooks,
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
    id: "archives",
    label: "Archives",
    description: "Restauration des donnees",
    component: ArchiveCenter,
    icon: PiShieldCheck,
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
        <section className="panel-section dashboard-hero">
          <div className="section-header">
            <p className="section-kicker">Administrateur</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {profileData?.firstName
                ? `Bonjour ${profileData.firstName}`
                : "Tableau de bord administrateur"}
            </h1>
          </div>
        </section>

        <DashboardMenu
          items={MENU_ITEMS}
          selectedItemId={selectedMenu}
          onSelect={handleMenuClick}
        />

        <section className="panel-section dashboard-stage">
          {renderContent()}
        </section>
      </div>
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;
