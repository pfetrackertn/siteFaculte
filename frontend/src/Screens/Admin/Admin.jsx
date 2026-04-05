import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { MdEdit, MdOutlineDelete } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import axiosWrapper from "../../utils/AxiosWrapper";
import CustomButton from "../../components/CustomButton";
import DeleteConfirm from "../../components/DeleteConfirm";
import Heading from "../../components/Heading";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import SectionCard from "../../components/SectionCard";
import FileUpload from "../../components/FileUpload";
import { getDefaultCountryLabel } from "../../utils/displayText";

const INITIAL_DATA = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  profile: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: getDefaultCountryLabel(),
  gender: "",
  dob: "",
  designation: "",
  joiningDate: "",
  salary: "",
  status: "active",
  emergencyContact: {
    name: "",
    relationship: "",
    phone: "",
  },
  bloodGroup: "",
};

const Admin = () => {
  const [data, setData] = useState(INITIAL_DATA);
  const [admins, setAdmins] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const userToken = localStorage.getItem("userToken");
  const [file, setFile] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const getAdminsHandler = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/admin", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setAdmins(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setAdmins([]);
        return;
      }
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des administrateurs"
      );
    } finally {
      setDataLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    getAdminsHandler();
  }, [getAdminsHandler]);

  const stats = useMemo(
    () => [
      { label: "Administrateurs", value: admins.length, tone: "primary" },
      {
        label: "Comptes principaux",
        value: admins.filter((item) => item.isSuperAdmin).length,
        tone: "warning",
      },
      {
        label: "Actifs",
        value: admins.filter((item) => item.status === "active").length,
        tone: "success",
      },
    ],
    [admins]
  );

  const visibleAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch = filters.search
        ? [
            admin.firstName,
            admin.lastName,
            admin.email,
            admin.employeeId,
            admin.designation,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesStatus = filters.status
        ? admin.status === filters.status
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [admins, filters]);

  const addAdminHandler = async () => {
    try {
      toast.loading(
        isEditing
          ? "Mise a jour de l'administrateur"
          : "Ajout de l'administrateur"
      );
      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${userToken}`,
      };

      const formData = new FormData();
      for (const key in data) {
        if (key === "emergencyContact") {
          for (const subKey in data.emergencyContact) {
            formData.append(
              `emergencyContact[${subKey}]`,
              data.emergencyContact[subKey]
            );
          }
        } else {
          formData.append(key, data[key]);
        }
      }

      if (file) {
        formData.append("file", file);
      }

      const response = isEditing
        ? await axiosWrapper.patch(`/admin/${selectedAdminId}`, formData, {
            headers,
          })
        : await axiosWrapper.post("/admin/register", formData, {
            headers,
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(
          isEditing
            ? response.data.message
            : "Administrateur cree avec succes. Mot de passe par defaut : admin123"
        );
        resetForm();
        getAdminsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Erreur");
    }
  };

  const editAdminHandler = (admin) => {
    setData({
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      phone: admin.phone || "",
      profile: admin.profile || "",
      address: admin.address || "",
      city: admin.city || "",
      state: admin.state || "",
      pincode: admin.pincode || "",
      country: admin.country || getDefaultCountryLabel(),
      gender: admin.gender || "",
      dob: admin.dob?.split("T")[0] || "",
      designation: admin.designation || "",
      joiningDate: admin.joiningDate?.split("T")[0] || "",
      salary: admin.salary || "",
      status: admin.status || "active",
      emergencyContact: {
        name: admin.emergencyContact?.name || "",
        relationship: admin.emergencyContact?.relationship || "",
        phone: admin.emergencyContact?.phone || "",
      },
      bloodGroup: admin.bloodGroup || "",
    });
    setSelectedAdminId(admin._id);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Suppression de l'administrateur");
      const response = await axiosWrapper.delete(`/admin/${selectedAdminId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success("L'administrateur a ete supprime avec succes");
        setIsDeleteConfirmOpen(false);
        getAdminsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Erreur");
    }
  };

  const resetForm = () => {
    setData(INITIAL_DATA);
    setFile(null);
    setShowAddForm(false);
    setIsEditing(false);
    setSelectedAdminId(null);
  };

  const handleInputChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const handleEmergencyContactChange = (field, value) => {
    setData({
      ...data,
      emergencyContact: { ...data.emergencyContact, [field]: value },
    });
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Gestion des administrateurs"
          subtitle="Creez, mettez a jour et archivez les comptes administratifs."
        />
        <CustomButton
          onClick={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setShowAddForm(true);
            }
          }}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          {showAddForm ? "Fermer le formulaire" : "Nouvel administrateur"}
        </CustomButton>
      </div>

      <div className="metric-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`metric-card ${
              stat.tone === "success"
                ? "metric-card-success"
                : stat.tone === "warning"
                ? "metric-card-warning"
                : "metric-card-primary"
            }`}
          >
            <p
              className={`metric-label ${
                stat.tone === "success"
                  ? "text-emerald-700"
                  : stat.tone === "warning"
                  ? "text-amber-700"
                  : "text-blue-700"
              }`}
            >
              {stat.label}
            </p>
            <p className="metric-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Filtres</p>
          <h2 className="section-title">Affiner les administrateurs</h2>
        </div>
        <div className="mt-5 filter-grid-2">
          <div className="field-group">
            <label className="field-label">Recherche</label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Nom, e-mail, matricule ou fonction"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Statut</label>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="">Tous</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {showAddForm ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-5xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing
                    ? "Modifier l'administrateur"
                    : "Ajouter un administrateur"}
                </h2>
                <p className="section-subtitle">
                  Renseignez l'identite, l'adresse et le contact d'urgence dans
                  un formulaire unifie.
                </p>
              </div>
              <CustomButton
                onClick={resetForm}
                variant="secondary"
                className="!rounded-xl !p-2.5"
              >
                <IoMdClose className="text-2xl" />
              </CustomButton>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                addAdminHandler();
              }}
            >
              <div className="modal-body space-y-6">
                <SectionCard className="px-6 py-6">
                  <div className="section-header">
                    <p className="section-kicker">Identite</p>
                    <h3 className="section-title">Informations personnelles</h3>
                  </div>
                  <div className="mt-5 form-grid-3">
                    <FileUpload
                      label="Photo de profil"
                      hint="Optionnel"
                      fileName={file?.name || data.profile}
                      accept="image/*"
                      onChange={(event) => setFile(event.target.files[0])}
                    />

                    <div className="field-group">
                      <label className="field-label">Prenom</label>
                      <input
                        type="text"
                        value={data.firstName}
                        onChange={(event) =>
                          handleInputChange("firstName", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Nom</label>
                      <input
                        type="text"
                        value={data.lastName}
                        onChange={(event) =>
                          handleInputChange("lastName", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">E-mail</label>
                      <input
                        type="email"
                        value={data.email}
                        onChange={(event) =>
                          handleInputChange("email", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Telephone</label>
                      <input
                        type="tel"
                        value={data.phone}
                        onChange={(event) =>
                          handleInputChange("phone", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Genre</label>
                      <select
                        value={data.gender}
                        onChange={(event) =>
                          handleInputChange("gender", event.target.value)
                        }
                        required
                      >
                        <option value="">Choisir un genre</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Date de naissance</label>
                      <input
                        type="date"
                        value={data.dob}
                        onChange={(event) =>
                          handleInputChange("dob", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Groupe sanguin</label>
                      <select
                        value={data.bloodGroup}
                        onChange={(event) =>
                          handleInputChange("bloodGroup", event.target.value)
                        }
                        required
                      >
                        <option value="">Choisir un groupe sanguin</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard className="px-6 py-6">
                  <div className="section-header">
                    <p className="section-kicker">Fonction</p>
                    <h3 className="section-title">Informations de poste</h3>
                  </div>
                  <div className="mt-5 form-grid">
                    <div className="field-group">
                      <label className="field-label">Fonction</label>
                      <input
                        type="text"
                        value={data.designation}
                        onChange={(event) =>
                          handleInputChange("designation", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Date d'embauche</label>
                      <input
                        type="date"
                        value={data.joiningDate}
                        onChange={(event) =>
                          handleInputChange("joiningDate", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Salaire</label>
                      <input
                        type="number"
                        value={data.salary}
                        onChange={(event) =>
                          handleInputChange("salary", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard className="px-6 py-6">
                  <div className="section-header">
                    <p className="section-kicker">Adresse</p>
                    <h3 className="section-title">Coordonnees</h3>
                  </div>
                  <div className="mt-5 form-grid">
                    <div className="field-group md:col-span-2">
                      <label className="field-label">Adresse</label>
                      <input
                        type="text"
                        value={data.address}
                        onChange={(event) =>
                          handleInputChange("address", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Ville</label>
                      <input
                        type="text"
                        value={data.city}
                        onChange={(event) =>
                          handleInputChange("city", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Region</label>
                      <input
                        type="text"
                        value={data.state}
                        onChange={(event) =>
                          handleInputChange("state", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Code postal</label>
                      <input
                        type="text"
                        value={data.pincode}
                        onChange={(event) =>
                          handleInputChange("pincode", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Pays</label>
                      <input
                        type="text"
                        value={data.country}
                        onChange={(event) =>
                          handleInputChange("country", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard className="px-6 py-6">
                  <div className="section-header">
                    <p className="section-kicker">Urgence</p>
                    <h3 className="section-title">Contact d'urgence</h3>
                  </div>
                  <div className="mt-5 form-grid-3">
                    <div className="field-group">
                      <label className="field-label">Nom</label>
                      <input
                        type="text"
                        value={data.emergencyContact.name}
                        onChange={(event) =>
                          handleEmergencyContactChange("name", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Lien</label>
                      <input
                        type="text"
                        value={data.emergencyContact.relationship}
                        onChange={(event) =>
                          handleEmergencyContactChange(
                            "relationship",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Telephone</label>
                      <input
                        type="tel"
                        value={data.emergencyContact.phone}
                        onChange={(event) =>
                          handleEmergencyContactChange("phone", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </SectionCard>

                <div className="modal-footer">
                  <div className="mr-auto rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
                    Le mot de passe par defaut sera{" "}
                    <span className="font-bold">admin123</span>
                  </div>
                  <CustomButton type="button" variant="secondary" onClick={resetForm}>
                    Annuler
                  </CustomButton>
                  <CustomButton type="submit">
                    {isEditing
                      ? "Modifier l'administrateur"
                      : "Ajouter l'administrateur"}
                  </CustomButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {dataLoading && !showAddForm ? (
        <Loading label="Chargement des administrateurs..." />
      ) : null}

      {!dataLoading && !showAddForm ? (
        admins.length === 0 ? (
          <NoData
            title="Aucun administrateur trouve"
            description="Ajoutez un premier compte pour organiser l'administration."
          />
        ) : visibleAdmins.length === 0 ? (
          <NoData
            title="Aucun resultat"
            description="Aucun administrateur ne correspond aux filtres selectionnes."
          />
        ) : (
          <div className="table-shell">
            <div className="table-toolbar">
              <div className="section-header">
                <p className="section-kicker">Equipe</p>
                <h2 className="section-title">Comptes administratifs</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>E-mail</th>
                    <th>Telephone</th>
                    <th>ID employe</th>
                    <th>Fonction</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAdmins.map((item) => (
                    <tr key={item._id}>
                      <td className="font-semibold text-slate-900">
                        {`${item.firstName} ${item.lastName}`}
                      </td>
                      <td>{item.email}</td>
                      <td>{item.phone}</td>
                      <td>{item.employeeId}</td>
                      <td>{item.designation}</td>
                      <td>
                        <div className="table-action-group">
                          <CustomButton
                            variant="secondary"
                            className="!p-2.5"
                            onClick={() => editAdminHandler(item)}
                          >
                            <MdEdit />
                          </CustomButton>
                          <CustomButton
                            variant="danger"
                            className="!p-2.5"
                            onClick={() => {
                              setIsDeleteConfirmOpen(true);
                              setSelectedAdminId(item._id);
                            }}
                          >
                            <MdOutlineDelete />
                          </CustomButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Voulez-vous vraiment supprimer cet administrateur ?"
      />
    </div>
  );
};

export default Admin;
