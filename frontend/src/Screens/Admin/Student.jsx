import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import Heading from "../../components/Heading";
import DeleteConfirm from "../../components/DeleteConfirm";
import axiosWrapper from "../../utils/AxiosWrapper";
import CustomButton from "../../components/CustomButton";
import NoData from "../../components/NoData";
import Loading from "../../components/Loading";
import FormSection from "../../components/FormSection";
import FileUpload from "../../components/FileUpload";
import useAcademicOptions from "../../hooks/useAcademicOptions";
import {
  formatSemesterLabel,
  getAcademicClassLabel,
  getDefaultCountryLabel,
  getStatusLabel,
} from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const INITIAL_FORM_DATA = {
  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",
  semester: "",
  branchId: "",
  departmentId: "",
  classId: "",
  academicYearId: "",
  promotionId: "",
  entryYear: "",
  gender: "",
  dob: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: getDefaultCountryLabel(),
  profile: "",
  status: "active",
  bloodGroup: "",
  emergencyContact: {
    name: "",
    relationship: "",
    phone: "",
  },
};

const Student = () => {
  const token = localStorage.getItem("userToken");
  const { academicYears, departments, branches, classes, promotions, refreshOptions } =
    useAcademicOptions();
  const [students, setStudents] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    academicYearId: "",
    departmentId: "",
    branchId: "",
    classId: "",
    promotionId: "",
    semester: "",
  });
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const filteredBranches = useMemo(() => {
    const departmentId = showModal ? formData.departmentId : filters.departmentId;
    if (!departmentId) {
      return branches;
    }

    return branches.filter(
      (branch) => branch.departmentId?._id === departmentId
    );
  }, [branches, filters.departmentId, formData.departmentId, showModal]);

  const filteredClasses = useMemo(() => {
    const scope = showModal ? formData : filters;
    return classes.filter((academicClass) => {
      if (
        scope.departmentId &&
        academicClass.departmentId?._id !== scope.departmentId
      ) {
        return false;
      }

      const branchId = scope.branchId || scope.branch;
      if (branchId && academicClass.branchId?._id !== branchId) {
        return false;
      }

      if (
        scope.academicYearId &&
        academicClass.academicYearId?._id !== scope.academicYearId
      ) {
        return false;
      }

      if (
        scope.semester &&
        Number(academicClass.semester) !== Number(scope.semester)
      ) {
        return false;
      }

      return true;
    });
  }, [classes, filters, formData, showModal]);

  const filteredPromotions = useMemo(() => {
    const scope = showModal ? formData : filters;
    return promotions.filter((promotion) => {
      if (
        scope.departmentId &&
        promotion.departmentId?._id !== scope.departmentId
      ) {
        return false;
      }
      if (scope.branchId && promotion.branchId?._id !== scope.branchId) {
        return false;
      }
      if (
        scope.academicYearId &&
        promotion.academicYearId?._id !== scope.academicYearId
      ) {
        return false;
      }
      return true;
    });
  }, [filters, formData, promotions, showModal]);

  const selectedStudentClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === formData.classId),
    [classes, formData.classId]
  );

  const selectedFilterClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === filters.classId),
    [classes, filters.classId]
  );

  const studentFormSemesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: selectedStudentClass,
        classes: filteredClasses,
        currentValue: formData.semester,
      }),
    [filteredClasses, formData.semester, selectedStudentClass]
  );

  const studentFilterSemesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: selectedFilterClass,
        classes: filteredClasses,
        currentValue: filters.semester,
      }),
    [filteredClasses, filters.semester, selectedFilterClass]
  );

  const visibleStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = filters.search
        ? fullName.includes(filters.search.toLowerCase()) ||
          String(student.enrollmentNo || "").includes(filters.search)
        : true;
      const matchesYear = filters.academicYearId
        ? student.academicYearId?._id === filters.academicYearId
        : true;
      const matchesDepartment = filters.departmentId
        ? student.departmentId?._id === filters.departmentId
        : true;
      const matchesBranch = filters.branchId
        ? student.branchId?._id === filters.branchId
        : true;
      const matchesClass = filters.classId
        ? student.classId?._id === filters.classId
        : true;
      const matchesPromotion = filters.promotionId
        ? student.promotionId?._id === filters.promotionId
        : true;
      const matchesSemester = filters.semester
        ? Number(student.semester) === Number(filters.semester)
        : true;

      return (
        matchesSearch &&
        matchesYear &&
        matchesDepartment &&
        matchesBranch &&
        matchesClass &&
        matchesPromotion &&
        matchesSemester
      );
    });
  }, [filters, students]);

  const stats = useMemo(
    () => [
      { label: "Etudiants", value: students.length },
      {
        label: "Actifs",
        value: students.filter((student) => student.status === "active").length,
      },
      {
        label: "Promotions",
        value: new Set(
          students.map((student) => student.promotionId?._id).filter(Boolean)
        ).size,
      },
    ],
    [students]
  );

  const fetchStudents = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/student", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setStudents([]);
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des etudiants"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleFormInputChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === "departmentId" ? { branchId: "", classId: "", promotionId: "" } : {}),
      ...(field === "branchId" ? { classId: "", promotionId: "" } : {}),
      ...(field === "academicYearId" ? { classId: "", promotionId: "" } : {}),
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      emergencyContact: {
        ...current.emergencyContact,
        [field]: value,
      },
    }));
  };

  const addStudentHandler = async (event) => {
    event.preventDefault();

    try {
      toast.loading(
        isEditing ? "Mise a jour de l'etudiant..." : "Ajout de l'etudiant..."
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
        } else {
          payload.append(key, formData[key]);
        }
      }

      if (file) {
        payload.append("file", file);
      }

      const response = isEditing
        ? await axiosWrapper.patch(`/student/${selectedStudentId}`, payload, {
            headers,
          })
        : await axiosWrapper.post(`/student/register`, payload, {
            headers,
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(
          isEditing
            ? response.data.message
            : "Etudiant cree avec succes. Mot de passe par defaut : student123"
        );
        resetForm();
        refreshOptions();
        fetchStudents();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Erreur");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage de l'etudiant...");
      const response = await axiosWrapper.delete(`/student/${selectedStudentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchStudents();
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
    setSelectedStudentId(null);
    setFile(null);
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Gestion des etudiants"
          subtitle="Rattachez chaque etudiant a son annee academique, sa promotion, son departement, sa filiere et sa classe."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvel etudiant
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
          <h2 className="section-title">Affiner les etudiants</h2>
        </div>
        <div className="mt-5 filter-grid-5">
          <div className="field-group">
            <label className="field-label">Recherche</label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Nom ou numero d'inscription"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Annee academique</label>
            <select
              value={filters.academicYearId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  academicYearId: event.target.value,
                  classId: "",
                  promotionId: "",
                }))
              }
            >
              <option value="">Toutes les annees</option>
              {academicYears.map((academicYear) => (
                <option key={academicYear._id} value={academicYear._id}>
                  {academicYear.name}
                </option>
              ))}
            </select>
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
                  classId: "",
                  promotionId: "",
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
                setFilters((current) => ({
                  ...current,
                  branchId: event.target.value,
                  classId: "",
                  promotionId: "",
                }))
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
          <div className="field-group">
            <label className="field-label">Classe</label>
            <select
              value={filters.classId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, classId: event.target.value }))
              }
            >
              <option value="">Toutes les classes</option>
              {filteredClasses.map((academicClass) => (
                <option key={academicClass._id} value={academicClass._id}>
                  {getAcademicClassLabel(academicClass)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 filter-grid-2">
          <div className="field-group">
            <label className="field-label">Promotion</label>
            <select
              value={filters.promotionId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  promotionId: event.target.value,
                }))
              }
            >
              <option value="">Toutes les promotions</option>
              {filteredPromotions.map((promotion) => (
                <option key={promotion._id} value={promotion._id}>
                  {promotion.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Semestre</label>
            <select
              value={filters.semester}
              onChange={(event) =>
                setFilters((current) => ({ ...current, semester: event.target.value }))
              }
            >
              <option value="">Tous les semestres</option>
              {studentFilterSemesterOptions.map((semester) => (
                <option key={semester} value={semester}>
                  {formatSemesterLabel(semester)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="mt-8">
          <Loading label="Chargement des etudiants..." />
        </div>
      ) : visibleStudents.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun etudiant"
            description="Ajoutez des etudiants ou adaptez vos filtres pour afficher les inscriptions."
          />
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Etudiant</th>
                <th className="px-5 py-4 text-left">Parcours</th>
                <th className="px-5 py-4 text-left">Contact</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student) => (
                <tr key={student._id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {[student.firstName, student.middleName, student.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {student.enrollmentNo} | {getStatusLabel(student.status)}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{student.departmentId?.name || "Sans departement"}</p>
                    <p>{student.branchId?.name || "Sans filiere"}</p>
                    <p>{getAcademicClassLabel(student.classId)}</p>
                    <p>{student.promotionId?.name || "Sans promotion"}</p>
                    <p>{student.academicYearId?.name || "Annee active"}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{student.email}</p>
                    <p>{student.phone}</p>
                    <p>{formatSemesterLabel(student.semester)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => {
                          setFormData({
                            firstName: student.firstName || "",
                            middleName: student.middleName || "",
                            lastName: student.lastName || "",
                            phone: student.phone || "",
                            semester: student.semester || "",
                            branchId: student.branchId?._id || "",
                            departmentId: student.departmentId?._id || "",
                            classId: student.classId?._id || "",
                            academicYearId: student.academicYearId?._id || "",
                            promotionId: student.promotionId?._id || "",
                            entryYear: student.entryYear || "",
                            gender: student.gender || "",
                            dob: student.dob?.split("T")[0] || "",
                            address: student.address || "",
                            city: student.city || "",
                            state: student.state || "",
                            pincode: student.pincode || "",
                            country: student.country || getDefaultCountryLabel(),
                            profile: student.profile || "",
                            status: student.status || "active",
                            bloodGroup: student.bloodGroup || "",
                            emergencyContact: {
                              name: student.emergencyContact?.name || "",
                              relationship: student.emergencyContact?.relationship || "",
                              phone: student.emergencyContact?.phone || "",
                            },
                          });
                          setSelectedStudentId(student._id);
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
                          setSelectedStudentId(student._id);
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
          <div className="modal-card max-w-6xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing ? "Modifier l'etudiant" : "Ajouter un etudiant"}
                </h2>
                <p className="section-subtitle">
                  Renseignez l'identite, l'affectation academique, l'adresse et
                  le contact d'urgence dans une structure plus lisible.
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

            <form onSubmit={addStudentHandler}>
              <div className="modal-body space-y-6">
                <FormSection
                  title="Informations personnelles"
                  subtitle="Identite, etat civil et statut du compte etudiant."
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
                          handleFormInputChange("firstName", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Postnom</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(event) =>
                          handleFormInputChange("middleName", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Nom</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(event) =>
                          handleFormInputChange("lastName", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Telephone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(event) =>
                          handleFormInputChange("phone", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Annee d'entree</label>
                      <input
                        type="number"
                        value={formData.entryYear}
                        onChange={(event) =>
                          handleFormInputChange("entryYear", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Date de naissance</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(event) =>
                          handleFormInputChange("dob", event.target.value)
                        }
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">Genre</label>
                      <select
                        value={formData.gender}
                        onChange={(event) =>
                          handleFormInputChange("gender", event.target.value)
                        }
                      >
                        <option value="">Choisir un genre</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Groupe sanguin</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(event) =>
                          handleFormInputChange("bloodGroup", event.target.value)
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

                    <div className="field-group">
                      <label className="field-label">Statut</label>
                      <select
                        value={formData.status}
                        onChange={(event) =>
                          handleFormInputChange("status", event.target.value)
                        }
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Informations academiques"
                  subtitle="Affectation a l'annee, au departement, a la filiere, a la classe et a la promotion."
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <div className="field-group">
                      <label className="field-label">Annee academique</label>
                      <select
                        value={formData.academicYearId}
                        onChange={(event) =>
                          handleFormInputChange(
                            "academicYearId",
                            event.target.value
                          )
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

                    <div className="field-group">
                      <label className="field-label">Departement</label>
                      <select
                        value={formData.departmentId}
                        onChange={(event) =>
                          handleFormInputChange("departmentId", event.target.value)
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
                          handleFormInputChange("branchId", event.target.value)
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
                      <label className="field-label">Classe</label>
                      <select
                        value={formData.classId}
                        onChange={(event) =>
                          handleFormInputChange("classId", event.target.value)
                        }
                      >
                        <option value="">Choisir une classe</option>
                        {filteredClasses.map((academicClass) => (
                          <option key={academicClass._id} value={academicClass._id}>
                            {getAcademicClassLabel(academicClass)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Promotion</label>
                      <select
                        value={formData.promotionId}
                        onChange={(event) =>
                          handleFormInputChange("promotionId", event.target.value)
                        }
                      >
                        <option value="">Choisir une promotion</option>
                        {filteredPromotions.map((promotion) => (
                          <option key={promotion._id} value={promotion._id}>
                            {promotion.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Semestre</label>
                      <select
                        value={formData.semester}
                        onChange={(event) =>
                          handleFormInputChange("semester", event.target.value)
                        }
                      >
                        <option value="">Choisir un semestre</option>
                        {studentFormSemesterOptions.map((semester) => (
                          <option key={semester} value={semester}>
                            {formatSemesterLabel(semester)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Adresse"
                  subtitle="Coordonnees de residence de l'etudiant."
                >
                  <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="field-group">
                      <label className="field-label">Adresse complete</label>
                      <textarea
                        value={formData.address}
                        onChange={(event) =>
                          handleFormInputChange("address", event.target.value)
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
                            handleFormInputChange("city", event.target.value)
                          }
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Region</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(event) =>
                            handleFormInputChange("state", event.target.value)
                          }
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Code postal</label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(event) =>
                            handleFormInputChange("pincode", event.target.value)
                          }
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Pays</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(event) =>
                            handleFormInputChange("country", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Contact d'urgence"
                  subtitle="Personne a prevenir en cas d'urgence."
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
        title="Archiver cet etudiant ?"
        message="L'etudiant disparaitra des listes actives tout en restant restorable depuis les archives."
      />
    </div>
  );
};

export default Student;
