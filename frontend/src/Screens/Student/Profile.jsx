import React, { useState } from "react";
import CustomButton from "../../components/CustomButton";
import UpdatePasswordLoggedIn from "../../components/UpdatePasswordLoggedIn";
import {
  formatLongDate,
  formatSemesterLabel,
  getAcademicClassLabel,
  getDefaultCountryLabel,
  getGenderLabel,
} from "../../utils/displayText";

const renderValue = (value) => value || "Non renseigne";

const ProfileField = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
      {renderValue(value)}
    </p>
  </div>
);

const StudentProfile = ({ profileData }) => {
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);

  if (!profileData) {
    return null;
  }

  const emergencyContact = profileData.emergencyContact || {};
  const fullName = [
    profileData.firstName,
    profileData.middleName,
    profileData.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4">
      <section className="panel-section overflow-hidden px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={`${process.env.REACT_APP_MEDIA_LINK}/${profileData.profile}`}
              alt={fullName || "Avatar etudiant"}
              className="h-28 w-28 rounded-[28px] object-cover ring-4 ring-blue-100"
            />
            <div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                {renderValue(fullName)}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {renderValue(profileData.email)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  {renderValue(profileData.branchId?.name)}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                  {formatSemesterLabel(profileData.semester)}
                </span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  {getAcademicClassLabel(profileData.classId)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <CustomButton
              onClick={() => setShowPasswordUpdate((current) => !current)}
            >
              {showPasswordUpdate ? "Fermer le panneau" : "Modifier le mot de passe"}
            </CustomButton>
            <p className="text-sm text-slate-500">
              Numero d'inscription :{" "}
              <span className="font-semibold text-slate-800">
                {renderValue(profileData.enrollmentNo)}
              </span>
            </p>
          </div>
        </div>
      </section>

      {showPasswordUpdate ? (
        <section className="panel-section px-6 py-6 sm:px-8">
          <UpdatePasswordLoggedIn onClose={() => setShowPasswordUpdate(false)} />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel-section px-6 py-6 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900">
            Informations personnelles
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ProfileField label="E-mail" value={profileData.email} />
            <ProfileField label="Telephone" value={profileData.phone} />
            <ProfileField
              label="Genre"
              value={getGenderLabel(profileData.gender)}
            />
            <ProfileField label="Groupe sanguin" value={profileData.bloodGroup} />
            <ProfileField
              label="Date de naissance"
              value={formatLongDate(profileData.dob)}
            />
            <ProfileField
              label="Classe"
              value={getAcademicClassLabel(profileData.classId)}
            />
          </div>
        </section>

        <section className="panel-section px-6 py-6 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900">
            Informations academiques
          </h2>
          <div className="mt-5 grid gap-4">
            <ProfileField
              label="Numero d'inscription"
              value={profileData.enrollmentNo}
            />
            <ProfileField label="Filiere" value={profileData.branchId?.name} />
            <ProfileField
              label="Departement"
              value={profileData.departmentId?.name}
            />
            <ProfileField
              label="Semestre"
              value={formatSemesterLabel(profileData.semester)}
            />
            <ProfileField
              label="Annee academique"
              value={profileData.academicYearId?.name}
            />
            <ProfileField
              label="Promotion"
              value={profileData.promotionId?.name}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel-section px-6 py-6 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900">Adresse</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ProfileField label="Adresse" value={profileData.address} />
            <ProfileField label="Ville" value={profileData.city} />
            <ProfileField label="Region" value={profileData.state} />
            <ProfileField label="Code postal" value={profileData.pincode} />
            <ProfileField
              label="Pays"
              value={profileData.country || getDefaultCountryLabel()}
            />
          </div>
        </section>

        <section className="panel-section px-6 py-6 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900">
            Contact d'urgence
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ProfileField label="Nom" value={emergencyContact.name} />
            <ProfileField label="Lien" value={emergencyContact.relationship} />
            <ProfileField label="Telephone" value={emergencyContact.phone} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentProfile;
