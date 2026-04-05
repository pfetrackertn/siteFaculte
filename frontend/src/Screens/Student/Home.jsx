import React, { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  PiBookOpenText,
  PiCalendarBlank,
  PiExam,
  PiMoney,
  PiMegaphone,
  PiStudent,
  PiTrendUp,
  PiBooks,
} from "react-icons/pi";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
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
import AcademicFees from "../AcademicFees";
import Library from "../Library";

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
  {
    id: "fees",
    label: "Frais",
    description: "Mes echeances academiques",
    component: AcademicFees,
    icon: PiMoney,
  },
  {
    id: "library",
    label: "Library",
    description: "Bibliotheque numerique",
    component: Library,
    icon: PiBooks,
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
        <section className="panel-section dashboard-hero">
          <div className="section-header">
            <p className="section-kicker">Etudiant</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {profileData?.firstName
                ? `Bonjour ${profileData.firstName}`
                : "Votre espace d'apprentissage"}
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
