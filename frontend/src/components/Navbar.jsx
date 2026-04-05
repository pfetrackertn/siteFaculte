import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import CustomButton from "./CustomButton";
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
              <div className="flex h-14 w-14 items-center justify-center rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.5)]">
                <img
                  src="/assets/isc-kin-logo.svg"
                  alt="Logo ISC-KIN"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Institution
                </p>
                <p className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  ISC-KIN
                </p>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
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
