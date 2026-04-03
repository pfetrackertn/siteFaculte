import React, { useState } from "react";
import UpdatePasswordLoggedIn from "../../components/UpdatePasswordLoggedIn";
import CustomButton from "../../components/CustomButton";
import {
  formatLongDate,
  getGenderLabel,
  getStatusLabel,
} from "../../utils/displayText";

const Profile = ({ profileData }) => {
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);

  if (!profileData) return null;

  const emptyText = "Non renseigne";
  const emergencyContact = profileData.emergencyContact || {};
  const salary =
    profileData.salary != null
      ? `₹${Number(profileData.salary).toLocaleString("fr-FR")}`
      : emptyText;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between gap-8 mb-12 border-b pb-8">
        <div className="flex items-center gap-8">
          <img
            src={`${process.env.REACT_APP_MEDIA_LINK}/${profileData.profile}`}
            alt="Profil"
            className="w-40 h-40 rounded-full object-cover ring-4 ring-blue-500 ring-offset-4"
          />
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {`${profileData.firstName} ${profileData.lastName}`}
            </h1>
            <p className="text-lg text-gray-600 mb-1">
              Identifiant employe : {profileData.employeeId}
            </p>
            <p className="text-lg text-blue-600 font-medium">
              {profileData.designation}
              {profileData.isSuperAdmin && " (Super administrateur)"}
            </p>
          </div>
        </div>
        <CustomButton onClick={() => setShowUpdatePasswordModal(true)}>
          Modifier le mot de passe
        </CustomButton>
        {showUpdatePasswordModal && (
          <UpdatePasswordLoggedIn
            onClose={() => setShowUpdatePasswordModal(false)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            Informations personnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">E-mail</label>
              <p className="text-gray-900">{profileData.email || emptyText}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Telephone</label>
              <p className="text-gray-900">{profileData.phone || emptyText}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Genre</label>
              <p className="text-gray-900">
                {getGenderLabel(profileData.gender) || emptyText}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Groupe sanguin
              </label>
              <p className="text-gray-900">
                {profileData.bloodGroup || emptyText}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Date de naissance
              </label>
              <p className="text-gray-900">{formatLongDate(profileData.dob)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Date d'arrivee
              </label>
              <p className="text-gray-900">
                {formatLongDate(profileData.joiningDate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Salaire</label>
              <p className="text-gray-900">{salary}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Statut</label>
              <p className="text-gray-900">
                {getStatusLabel(profileData.status) || emptyText}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="text-gray-900">
                {profileData.isSuperAdmin
                  ? "Super administrateur"
                  : "Administrateur"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            Adresse
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Adresse</label>
              <p className="text-gray-900">{profileData.address || emptyText}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ville</label>
              <p className="text-gray-900">{profileData.city || emptyText}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Region</label>
              <p className="text-gray-900">{profileData.state || emptyText}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Code postal
              </label>
              <p className="text-gray-900">{profileData.pincode || emptyText}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Pays</label>
              <p className="text-gray-900">{profileData.country || emptyText}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            Contact d'urgence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Nom</label>
              <p className="text-gray-900">{emergencyContact.name || emptyText}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Lien</label>
              <p className="text-gray-900">
                {emergencyContact.relationship || emptyText}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Telephone</label>
              <p className="text-gray-900">{emergencyContact.phone || emptyText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
