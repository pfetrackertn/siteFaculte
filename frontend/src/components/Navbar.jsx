import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import CustomButton from "./CustomButton";
import BrandMark from "./BrandMark";
import { getUserTypeLabel } from "../utils/displayText";

const Navbar = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const currentUserType = localStorage.getItem("userType");
  const displayType = getUserTypeLabel(router.state?.type || currentUserType);

  const logoutHandler = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userType");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-2xl">
      <div className="page-shell py-4">
        <div className="panel-section relative overflow-hidden px-5 py-4 sm:px-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-56 bg-[radial-gradient(circle_at_left,rgba(247,223,55,0.18),transparent_62%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-56 bg-[radial-gradient(circle_at_right,rgba(31,135,216,0.16),transparent_62%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="flex items-center gap-4 text-left"
            onClick={() => navigate("/")}
          >
            <BrandMark
              compact
              subtitle={`${displayType} - Tableau de bord`}
            />
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 sm:inline-flex">
              ISC-KIN
            </span>
            <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 lg:inline-flex">
              {displayType}
            </span>
            <CustomButton variant="danger" onClick={logoutHandler}>
              Deconnexion
              <FiLogOut className="text-base" />
            </CustomButton>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
