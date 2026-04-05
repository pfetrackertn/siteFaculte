import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { MdEdit, MdOutlineDelete } from "react-icons/md";
import Heading from "../../components/Heading";
import CustomButton from "../../components/CustomButton";
import DeleteConfirm from "../../components/DeleteConfirm";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import FormSection from "../../components/FormSection";
import axiosWrapper from "../../utils/AxiosWrapper";
import useAcademicOptions from "../../hooks/useAcademicOptions";
import {
  formatSemesterLabel,
  getLmdLevelLabel,
  getProgramTypeLabel,
  getStatusLabel,
} from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const INITIAL_FORM_DATA = {
  name: "",
  code: "",
  branchId: "",
  departmentId: "",
  academicYearId: "",
  level: "L1",
  programType: "licence",
  semester: "",
  capacity: "",
  description: "",
  status: "active",
};

const Classes = () => {
  const token = localStorage.getItem("userToken");
  const { academicYears, departments, branches, refreshOptions } =
    useAcademicOptions();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [filters, setFilters] = useState({
    search: "",
    academicYearId: "",
    departmentId: "",
    branchId: "",
    status: "",
  });

  const fetchClasses = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/class", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setClasses([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Impossible de charger les classes"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredBranches = useMemo(() => {
    if (!formData.departmentId) {
      return branches;
    }

    return branches.filter(
      (branch) => branch.departmentId?._id === formData.departmentId
    );
  }, [branches, formData.departmentId]);

  const stats = useMemo(() => {
    return [
      { label: "Classes", value: classes.length },
      {
        label: "Actives",
        value: classes.filter((academicClass) => academicClass.status === "active")
          .length,
      },
      {
        label: "LMD couverts",
        value: new Set(classes.map((academicClass) => academicClass.level)).size,
      },
    ];
  }, [classes]);

  const filteredListBranches = useMemo(() => {
    if (!filters.departmentId) {
      return branches;
    }

    return branches.filter(
      (branch) => branch.departmentId?._id === filters.departmentId
    );
  }, [branches, filters.departmentId]);

  const visibleClasses = useMemo(() => {
    return classes.filter((academicClass) => {
      const matchesSearch = filters.search
        ? [
            academicClass.name,
            academicClass.code,
            academicClass.description,
            academicClass.level,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesYear = filters.academicYearId
        ? academicClass.academicYearId?._id === filters.academicYearId
        : true;
      const matchesDepartment = filters.departmentId
        ? academicClass.departmentId?._id === filters.departmentId
        : true;
      const matchesBranch = filters.branchId
        ? academicClass.branchId?._id === filters.branchId
        : true;
      const matchesStatus = filters.status
        ? academicClass.status === filters.status
        : true;

      return (
        matchesSearch &&
        matchesYear &&
        matchesDepartment &&
        matchesBranch &&
        matchesStatus
      );
    });
  }, [classes, filters]);

  const classSemesterOptions = useMemo(
    () =>
      getSemesterOptions({
        programType: formData.programType,
        level: formData.level,
        currentValue: formData.semester,
      }),
    [formData.level, formData.programType, formData.semester]
  );

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedClassId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.code || !formData.branchId || !formData.semester) {
      toast.error("Le nom, le code, la filiere et le semestre sont requis");
      return;
    }

    try {
      toast.loading(
        isEditing ? "Mise a jour de la classe..." : "Ajout de la classe..."
      );

      const response = isEditing
        ? await axiosWrapper.patch(`/class/${selectedClassId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axiosWrapper.post("/class", formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        refreshOptions();
        fetchClasses();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage de la classe...");
      const response = await axiosWrapper.delete(`/class/${selectedClassId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchClasses();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Archivage impossible");
    }
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Gestion des classes"
          subtitle="Structurez les niveaux LMD, le semestre, le departement et l'annee academique de chaque classe."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvelle classe
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
          <h2 className="section-title">Affiner les classes</h2>
        </div>
        <div className="mt-5 filter-grid-5">
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
              placeholder="Nom, code ou niveau"
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
                }))
              }
            >
              <option value="">Toutes</option>
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
                }))
              }
            >
              <option value="">Tous</option>
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
                }))
              }
            >
              <option value="">Toutes</option>
              {filteredListBranches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
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

      {dataLoading ? (
        <div className="mt-8">
          <Loading label="Chargement des classes..." />
        </div>
      ) : classes.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucune classe"
            description="Ajoutez vos classes LMD pour rattacher etudiants, promotions, frais et ressources."
          />
        </div>
      ) : visibleClasses.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucune classe ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Classe</th>
                <th className="px-5 py-4 text-left">Structure</th>
                <th className="px-5 py-4 text-left">Capacite</th>
                <th className="px-5 py-4 text-left">Statut</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleClasses.map((academicClass) => (
                <tr key={academicClass._id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {academicClass.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {academicClass.code} | {getLmdLevelLabel(academicClass.level)}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{academicClass.departmentId?.name || "Sans departement"}</p>
                    <p>{academicClass.branchId?.name || "Sans filiere"}</p>
                    <p>{academicClass.academicYearId?.name || "Annee active"}</p>
                    <p>{formatSemesterLabel(academicClass.semester)}</p>
                    <p>{getProgramTypeLabel(academicClass.programType)}</p>
                  </td>
                  <td className="px-5 py-4">{academicClass.capacity || 0}</td>
                  <td className="px-5 py-4">
                    {getStatusLabel(academicClass.status)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => {
                          setFormData({
                            name: academicClass.name || "",
                            code: academicClass.code || "",
                            branchId: academicClass.branchId?._id || "",
                            departmentId: academicClass.departmentId?._id || "",
                            academicYearId: academicClass.academicYearId?._id || "",
                            level: academicClass.level || "L1",
                            programType: academicClass.programType || "licence",
                            semester: academicClass.semester || "",
                            capacity: academicClass.capacity || "",
                            description: academicClass.description || "",
                            status: academicClass.status || "active",
                          });
                          setSelectedClassId(academicClass._id);
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
                          setSelectedClassId(academicClass._id);
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
          <div className="modal-card max-w-3xl">
            <div className="modal-header">
              <div>
              <h2 className="section-title">
                {isEditing ? "Modifier la classe" : "Ajouter une classe"}
              </h2>
              <p className="section-subtitle">
                Definissez le niveau LMD, la structure et la capacite dans un formulaire stable.
              </p>
              </div>
              <button
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                onClick={resetForm}
              >
                <IoMdClose className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-6">
                <FormSection
                  title="Structure de la classe"
                  subtitle="Identifiez le niveau, la filiere et le cycle academique."
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="field-group">
                      <label className="field-label">Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                  />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Departement</label>
                  <select
                    value={formData.departmentId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        departmentId: event.target.value,
                        branchId: "",
                      }))
                    }
                  >
                    <option value="">Aucun</option>
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
                      setFormData((current) => ({
                        ...current,
                        branchId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selectionner</option>
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
                      setFormData((current) => ({
                        ...current,
                        academicYearId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Annee active</option>
                    {academicYears.map((academicYear) => (
                      <option key={academicYear._id} value={academicYear._id}>
                        {academicYear.name}
                      </option>
                    ))}
                  </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Niveau LMD</label>
                  <select
                    value={formData.level}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        level: event.target.value,
                        programType: event.target.value.startsWith("M")
                          ? "master"
                          : event.target.value.startsWith("D")
                          ? "doctorat"
                          : "licence",
                      }))
                    }
                  >
                    <option value="L1">Licence 1</option>
                    <option value="L2">Licence 2</option>
                    <option value="L3">Licence 3</option>
                    <option value="M1">Master 1</option>
                    <option value="M2">Master 2</option>
                    <option value="D1">Doctorat 1</option>
                    <option value="D2">Doctorat 2</option>
                    <option value="D3">Doctorat 3</option>
                  </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Type de programme</label>
                  <select
                    value={formData.programType}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        programType: event.target.value,
                      }))
                    }
                  >
                    <option value="licence">Licence</option>
                    <option value="master">Master</option>
                    <option value="doctorat">Doctorat</option>
                  </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Semestre</label>
                      <select
                        value={formData.semester}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            semester: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choisir un semestre</option>
                        {classSemesterOptions.map((semester) => (
                          <option key={semester} value={semester}>
                            {formatSemesterLabel(semester)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Capacite et description"
                  subtitle="Precisez la capacite d'accueil et les informations complementaires."
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="field-group">
                      <label className="field-label">Capacite</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        capacity: event.target.value,
                      }))
                    }
                  />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                    </div>
                    <div className="field-group md:col-span-2">
                      <label className="field-label">Description</label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </FormSection>
              </div>

              <div className="modal-footer">
                <CustomButton variant="secondary" onClick={resetForm}>
                  Annuler
                </CustomButton>
                <CustomButton type="submit">
                  {isEditing ? "Mettre a jour" : "Creer"}
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
        title="Archiver cette classe ?"
        message="Elle sera retiree des listes actives sans perdre son historique."
      />
    </div>
  );
};

export default Classes;
