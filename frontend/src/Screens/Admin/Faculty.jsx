import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import axiosWrapper from "../../utils/AxiosWrapper";
import Heading from "../../components/Heading";
import DeleteConfirm from "../../components/DeleteConfirm";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import FormSection from "../../components/FormSection";
import FileUpload from "../../components/FileUpload";
import useAcademicOptions from "../../hooks/useAcademicOptions";
import { getDefaultCountryLabel } from "../../utils/displayText";

const INITIAL_FORM_DATA = {
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
  branchId: "",
  departmentId: "",
  academicYearId: "",
  assignedClassIds: [],
};

const Faculty = () => {
  const token = localStorage.getItem("userToken");
  const { academicYears, departments, branches, classes, refreshOptions } =
    useAcademicOptions();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    branchId: "",
  });
  const [file, setFile] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const filteredBranches = useMemo(() => {
    if (!formData.departmentId) {
      return branches;
    }

    return branches.filter(
      (branch) => branch.departmentId?._id === formData.departmentId
    );
  }, [branches, formData.departmentId]);

  const filteredClasses = useMemo(() => {
    return classes.filter((academicClass) => {
      if (
        formData.departmentId &&
        academicClass.departmentId?._id !== formData.departmentId
      ) {
        return false;
      }

      if (formData.branchId && academicClass.branchId?._id !== formData.branchId) {
        return false;
      }

      return true;
    });
  }, [classes, formData.branchId, formData.departmentId]);

  const visibleFaculty = useMemo(() => {
    return faculty.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const matchesSearch = filters.search
        ? fullName.includes(filters.search.toLowerCase()) ||
          item.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
          String(item.employeeId || "").includes(filters.search)
        : true;
      const matchesDepartment = filters.departmentId
        ? item.departmentId?._id === filters.departmentId
        : true;
      const matchesBranch = filters.branchId
        ? item.branchId?._id === filters.branchId
        : true;

      return matchesSearch && matchesDepartment && matchesBranch;
    });
  }, [faculty, filters]);

  const stats = useMemo(
    () => [
      { label: "Enseignants", value: faculty.length },
      {
        label: "Actifs",
        value: faculty.filter((item) => item.status === "active").length,
      },
      {
        label: "Departements",
        value: new Set(
          faculty.map((item) => item.departmentId?._id).filter(Boolean)
        ).size,
      },
    ],
    [faculty]
  );

  const fetchFaculty = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/faculty", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setFaculty(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setFaculty([]);
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des enseignants"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const addFacultyHandler = async (event) => {
    event.preventDefault();

    try {
      toast.loading(
        isEditing
          ? "Mise a jour de l'enseignant..."
          : "Ajout de l'enseignant..."
      );
      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      };

      const payload = new FormData();
      for (const key in formData) {
        if (key === "emergencyContact") {
          for (const subKey in formData.emergencyContact) {
            payload.append(
              `emergencyContact[${subKey}]`,
              formData.emergencyContact[subKey]
            );
          }
        } else if (key === "assignedClassIds") {
          formData.assignedClassIds.forEach((classId) =>
            payload.append("assignedClassIds", classId)
          );
        } else {
          payload.append(key, formData[key]);
        }
      }

      if (file) {
        payload.append("file", file);
      }

      const response = isEditing
        ? await axiosWrapper.patch(`/faculty/${selectedFacultyId}`, payload, {
            headers,
          })
        : await axiosWrapper.post(`/faculty/register`, payload, {
            headers,
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(
          isEditing
            ? response.data.message
            : "Enseignant cree avec succes. Mot de passe par defaut : faculty123"
        );
        resetForm();
        refreshOptions();
        fetchFaculty();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Erreur");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Suppression de l'enseignant...");
      const response = await axiosWrapper.delete(`/faculty/${selectedFacultyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchFaculty();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Erreur");
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedFacultyId(null);
    setFile(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === "departmentId" ? { branchId: "", assignedClassIds: [] } : {}),
      ...(field === "branchId" ? { assignedClassIds: [] } : {}),
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      emergencyContact: { ...current.emergencyContact, [field]: value },
    }));
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Gestion des enseignants"
          subtitle="Affectez les enseignants a un departement, une filiere, des classes et une annee academique."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvel enseignant
        </CustomButton>
      </div>

      <div className="metric-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="panel-section px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Filtres</p>
          <h2 className="section-title">Affiner les enseignants</h2>
        </div>
        <div className="mt-5 filter-grid-3">
          <div className="field-group">
            <label className="field-label">Recherche</label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Nom, e-mail ou matricule"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Departement</label>
            <select
              value={filters.departmentId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  departmentId: event.target.value,
                  branchId: "",
                }))
              }
            >
              <option value="">Tous les departements</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Filiere</label>
            <select
              value={filters.branchId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, branchId: event.target.value }))
              }
            >
              <option value="">Toutes les filieres</option>
              {branches
                .filter((branch) =>
                  filters.departmentId
                    ? branch.departmentId?._id === filters.departmentId
                    : true
                )
                .map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="mt-8">
          <Loading label="Chargement des enseignants..." />
        </div>
      ) : visibleFaculty.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun enseignant"
            description="Ajoutez des enseignants pour gerer les ressources, les notes et les examens."
          />
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Enseignant</th>
                <th className="px-5 py-4 text-left">Affectation</th>
                <th className="px-5 py-4 text-left">Contact</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleFaculty.map((item) => (
                <tr key={item._id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.employeeId} | {item.designation}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{item.departmentId?.name || "Sans departement"}</p>
                    <p>{item.branchId?.name || "Sans filiere"}</p>
                    <p>{item.academicYearId?.name || "Annee active"}</p>
                    <p>
                      {item.assignedClassIds?.length
                        ? item.assignedClassIds
                            .map((academicClass) => academicClass.name || academicClass.code)
                            .join(", ")
                        : "Sans classe"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{item.email}</p>
                    <p>{item.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => {
                          setFormData({
                            firstName: item.firstName || "",
                            lastName: item.lastName || "",
                            email: item.email || "",
                            phone: item.phone || "",
                            profile: item.profile || "",
                            address: item.address || "",
                            city: item.city || "",
                            state: item.state || "",
                            pincode: item.pincode || "",
                            country: item.country || getDefaultCountryLabel(),
                            gender: item.gender || "",
                            dob: item.dob?.split("T")[0] || "",
                            designation: item.designation || "",
                            joiningDate: item.joiningDate?.split("T")[0] || "",
                            salary: item.salary || "",
                            status: item.status || "active",
                            emergencyContact: {
                              name: item.emergencyContact?.name || "",
                              relationship: item.emergencyContact?.relationship || "",
                              phone: item.emergencyContact?.phone || "",
                            },
                            bloodGroup: item.bloodGroup || "",
                            branchId: item.branchId?._id || "",
                            departmentId: item.departmentId?._id || "",
                            academicYearId: item.academicYearId?._id || "",
                            assignedClassIds:
                              item.assignedClassIds?.map((classItem) => classItem._id) || [],
                          });
                          setSelectedFacultyId(item._id);
                          setIsEditing(true);
                          setShowModal(true);
                        }}
                      >
                        <MdEdit />
                      </CustomButton>
                      <CustomButton
                        variant="danger"
                        className="!p-2"
                        onClick={() => {
                          setSelectedFacultyId(item._id);
                          setIsDeleteConfirmOpen(true);
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
      )}

      {showModal ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-5xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing ? "Modifier l'enseignant" : "Ajouter un enseignant"}
                </h2>
                <p className="section-subtitle">
                  Structurez les informations personnelles, l'affectation
                  academique et les classes assignees dans un formulaire
                  uniforme.
                </p>
              </div>
              <CustomButton
                variant="secondary"
                className="!rounded-xl !p-2.5"
                onClick={resetForm}
              >
                <IoMdClose className="text-2xl" />
              </CustomButton>
            </div>
            <form onSubmit={addFacultyHandler}>
              <div className="modal-body space-y-6">
                <FormSection
                  title="Informations personnelles"
                  subtitle="Identite, coordonnees directes et etat civil de l'enseignant."
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <FileUpload
                      label="Photo de profil"
                      fileName={file?.name || formData.profile}
                      accept="image/*"
                      onChange={(event) => setFile(event.target.files[0])}
                    />

                    <div className="field-group">
                      <label className="field-label">Prenom</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(event) =>
                          handleInputChange("firstName", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Nom</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(event) =>
                          handleInputChange("lastName", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">E-mail</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          handleInputChange("email", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Telephone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(event) =>
                          handleInputChange("phone", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Genre</label>
                      <select
                        value={formData.gender}
                        onChange={(event) =>
                          handleInputChange("gender", event.target.value)
                        }
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
                        value={formData.dob}
                        onChange={(event) =>
                          handleInputChange("dob", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Groupe sanguin</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(event) =>
                          handleInputChange("bloodGroup", event.target.value)
                        }
                      >
                        <option value="">Choisir un groupe sanguin</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                          (group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Informations academiques"
                  subtitle="Fonction, affectation academique et classes suivies."
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <div className="field-group">
                      <label className="field-label">Fonction</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(event) =>
                          handleInputChange("designation", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Date d'embauche</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(event) =>
                          handleInputChange("joiningDate", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Salaire</label>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(event) =>
                          handleInputChange("salary", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Statut</label>
                      <select
                        value={formData.status}
                        onChange={(event) =>
                          handleInputChange("status", event.target.value)
                        }
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Departement</label>
                      <select
                        value={formData.departmentId}
                        onChange={(event) =>
                          handleInputChange("departmentId", event.target.value)
                        }
                      >
                        <option value="">Choisir un departement</option>
                        {departments.map((department) => (
                          <option key={department._id} value={department._id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Filiere</label>
                      <select
                        value={formData.branchId}
                        onChange={(event) =>
                          handleInputChange("branchId", event.target.value)
                        }
                      >
                        <option value="">Choisir une filiere</option>
                        {filteredBranches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Annee academique</label>
                      <select
                        value={formData.academicYearId}
                        onChange={(event) =>
                          handleInputChange("academicYearId", event.target.value)
                        }
                      >
                        <option value="">Annee academique active</option>
                        {academicYears.map((academicYear) => (
                          <option key={academicYear._id} value={academicYear._id}>
                            {academicYear.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 field-group">
                    <label className="field-label">Classes assignees</label>
                    {filteredClasses.length ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {filteredClasses.map((academicClass) => (
                          <label
                            key={academicClass._id}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assignedClassIds.includes(
                                academicClass._id
                              )}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setFormData((current) => ({
                                  ...current,
                                  assignedClassIds: checked
                                    ? [...current.assignedClassIds, academicClass._id]
                                    : current.assignedClassIds.filter(
                                        (value) => value !== academicClass._id
                                      ),
                                }));
                              }}
                            />
                            <span>{academicClass.name || academicClass.code}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state-compact">
                        Aucune classe disponible pour cette combinaison de
                        departement et de filiere.
                      </div>
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title="Adresse"
                  subtitle="Coordonnees de residence et de localisation."
                >
                  <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="field-group">
                      <label className="field-label">Adresse complete</label>
                      <textarea
                        value={formData.address}
                        onChange={(event) =>
                          handleInputChange("address", event.target.value)
                        }
                        rows={5}
                      />
                    </div>
                    <div className="grid gap-4">
                      <div className="field-group">
                        <label className="field-label">Ville</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(event) =>
                            handleInputChange("city", event.target.value)
                          }
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Region</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(event) =>
                            handleInputChange("state", event.target.value)
                          }
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Code postal</label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(event) =>
                            handleInputChange("pincode", event.target.value)
                          }
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Pays</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(event) =>
                            handleInputChange("country", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Contact d'urgence"
                  subtitle="Personne a contacter rapidement en cas de besoin."
                >
                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="field-group">
                      <label className="field-label">Nom</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(event) =>
                          handleEmergencyContactChange("name", event.target.value)
                        }
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Lien</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.relationship}
                        onChange={(event) =>
                          handleEmergencyContactChange(
                            "relationship",
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Telephone</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.phone}
                        onChange={(event) =>
                          handleEmergencyContactChange("phone", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </FormSection>
              </div>

              <div className="modal-footer">
                <CustomButton type="button" variant="secondary" onClick={resetForm}>
                  Annuler
                </CustomButton>
                <CustomButton type="submit">
                  {isEditing ? "Mettre a jour" : "Ajouter"}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer cet enseignant ?"
        message="Cette action est definitive pour le compte enseignant."
      />
    </div>
  );
};

export default Faculty;
