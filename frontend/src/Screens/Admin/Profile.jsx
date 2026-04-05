import React, { useMemo, useState } from "react";
import CustomButton from "../../components/CustomButton";
import InfoItem from "../../components/InfoItem";
import SectionCard from "../../components/SectionCard";
import StatusBadge from "../../components/StatusBadge";
import UpdatePasswordLoggedIn from "../../components/UpdatePasswordLoggedIn";
import {
  formatCurrencyCdf,
  formatLongDate,
  getDefaultCountryLabel,
  getGenderLabel,
  getStatusLabel,
} from "../../utils/displayText";

const renderValue = (value) => value || "Non renseigne";

const Profile = ({ profileData }) => {
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);

  const fullName = useMemo(
    () => [profileData?.firstName, profileData?.lastName].filter(Boolean).join(" "),
    [profileData?.firstName, profileData?.lastName]
  );

  if (!profileData) {
    return null;
  }

  const emergencyContact = profileData.emergencyContact || {};
  const salary =
    profileData.salary != null
      ? formatCurrencyCdf(profileData.salary)
      : "Non renseigne";

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4">
      <SectionCard className="overflow-hidden px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={`${process.env.REACT_APP_MEDIA_LINK}/${profileData.profile}`}
              alt={fullName || "Avatar administrateur"}
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
                <StatusBadge tone="primary">
                  Administrateur
                </StatusBadge>
                <StatusBadge
                  tone={profileData.status === "active" ? "success" : "warning"}
                >
                  {getStatusLabel(profileData.status)}
                </StatusBadge>
                <StatusBadge tone="neutral">
                  {renderValue(profileData.designation)}
                </StatusBadge>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <CustomButton onClick={() => setShowUpdatePasswordModal(true)}>
              Modifier le mot de passe
            </CustomButton>
            <p className="text-sm text-slate-500">
              Identifiant employe :{" "}
              <span className="font-semibold text-slate-800">
                {renderValue(profileData.employeeId)}
              </span>
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard className="px-6 py-6 sm:px-8">
          <div className="section-header">
            <p className="section-kicker">Identite</p>
            <h2 className="section-title">Informations personnelles</h2>
          </div>
          <div className="mt-5 info-grid">
            <InfoItem label="E-mail" value={profileData.email} />
            <InfoItem label="Telephone" value={profileData.phone} />
            <InfoItem label="Genre" value={getGenderLabel(profileData.gender)} />
            <InfoItem label="Groupe sanguin" value={profileData.bloodGroup} />
            <InfoItem
              label="Date de naissance"
              value={formatLongDate(profileData.dob)}
            />
            <InfoItem
              label="Date d'arrivee"
              value={formatLongDate(profileData.joiningDate)}
            />
          </div>
        </SectionCard>

        <SectionCard className="px-6 py-6 sm:px-8">
          <div className="section-header">
            <p className="section-kicker">Fonction</p>
            <h2 className="section-title">Informations administratives</h2>
          </div>
          <div className="mt-5 info-grid-2">
            <InfoItem label="Fonction" value={profileData.designation} />
            <InfoItem label="Salaire" value={salary} />
            <InfoItem label="Statut" value={getStatusLabel(profileData.status)} />
            <InfoItem
              label="Role"
              value="Administrateur"
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard className="px-6 py-6 sm:px-8">
          <div className="section-header">
            <p className="section-kicker">Coordonnees</p>
            <h2 className="section-title">Adresse</h2>
          </div>
          <div className="mt-5 info-grid-2">
            <InfoItem label="Adresse" value={profileData.address} />
            <InfoItem label="Ville" value={profileData.city} />
            <InfoItem label="Region" value={profileData.state} />
            <InfoItem label="Code postal" value={profileData.pincode} />
            <InfoItem
              label="Pays"
              value={profileData.country || getDefaultCountryLabel()}
            />
          </div>
        </SectionCard>

        <SectionCard className="px-6 py-6 sm:px-8">
          <div className="section-header">
            <p className="section-kicker">Support</p>
            <h2 className="section-title">Contact d'urgence</h2>
          </div>
          <div className="mt-5 info-grid-2">
            <InfoItem label="Nom" value={emergencyContact.name} />
            <InfoItem label="Lien" value={emergencyContact.relationship} />
            <InfoItem label="Telephone" value={emergencyContact.phone} />
          </div>
        </SectionCard>
      </div>

      {showUpdatePasswordModal ? (
        <UpdatePasswordLoggedIn
          onClose={() => setShowUpdatePasswordModal(false)}
        />
      ) : null}
    </div>
  );
};

export default Profile;
