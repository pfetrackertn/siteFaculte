import React, { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  PiBookOpenText,
  PiBooks,
  PiCalendarBlank,
  PiExam,
  PiMagnifyingGlass,
  PiMegaphone,
  PiNotePencil,
  PiUserCircleGear,
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
import AddMarks from "./AddMarks";
import Material from "./Material";
import Profile from "./Profile";
import StudentFinder from "./StudentFinder";
import Timetable from "./Timetable";
import Library from "../Library";

const MENU_ITEMS = [
  {
    id: "home",
    label: "Profil",
    description: "Votre espace personnel",
    component: null,
    icon: PiUserCircleGear,
  },
  {
    id: "timetable",
    label: "Emploi du temps",
    description: "Publier et mettre a jour",
    component: Timetable,
    icon: PiCalendarBlank,
  },
  {
    id: "material",
    label: "Ressources",
    description: "Documents et supports",
    component: Material,
    icon: PiBookOpenText,
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
    description: "Messages a destination des etudiants",
    component: Notice,
    icon: PiMegaphone,
  },
  {
    id: "student-info",
    label: "Etudiants",
    description: "Recherche et consultation",
    component: StudentFinder,
    icon: PiMagnifyingGlass,
  },
  {
    id: "marks",
    label: "Notes",
    description: "Saisie et validation des resultats",
    component: AddMarks,
    icon: PiNotePencil,
  },
  {
    id: "exam",
    label: "Examens",
    description: "Planification et documents",
    component: Exam,
    icon: PiExam,
  },
];

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const userToken = localStorage.getItem("userToken");
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      toast.loading("Chargement du profil...");
      const response = await axiosWrapper.get("/faculty/my-details", {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (response.data.success) {
        setProfileData(response.data.data);
        dispatch(setUserData(response.data.data));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible de charger le profil"
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
    navigate(`/faculty?page=${menuId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loading label="Chargement de votre espace enseignant..." />;
    }

    if (selectedMenu === "home" && profileData) {
      return <Profile profileData={profileData} />;
    }

    const menuItem = MENU_ITEMS.find((item) => item.id === selectedMenu);

    if (menuItem && menuItem.component) {
      const Component = menuItem.component;
      return <Component />;
    }

    return null;
  };

  return (
    <>
      <Navbar />
      <div className="page-shell space-y-6 py-6 sm:py-8">
        <section className="panel-section dashboard-hero">
          <div className="section-header">
            <p className="section-kicker">Enseignant</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {profileData?.firstName
                ? `Bonjour ${profileData.firstName}`
                : "Tableau de bord enseignant"}
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
