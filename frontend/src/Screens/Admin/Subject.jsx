import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import Heading from "../../components/Heading";
import DeleteConfirm from "../../components/DeleteConfirm";
import axiosWrapper from "../../utils/AxiosWrapper";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import FormSection from "../../components/FormSection";
import useAcademicOptions from "../../hooks/useAcademicOptions";
import {
  formatSemesterLabel,
  getAcademicClassLabel,
  getStatusLabel,
} from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const INITIAL_FORM_DATA = {
  name: "",
  code: "",
  branch: "",
  departmentId: "",
  classId: "",
  academicYearId: "",
  semester: "",
  credits: "",
  status: "active",
};

const Subject = () => {
  const token = localStorage.getItem("userToken");
  const { academicYears, departments, branches, classes, refreshOptions } =
    useAcademicOptions();
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [filters, setFilters] = useState({
    search: "",
    academicYearId: "",
    departmentId: "",
    branchId: "",
    classId: "",
    status: "",
  });

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

      if (formData.branch && academicClass.branchId?._id !== formData.branch) {
        return false;
      }

      if (
        formData.academicYearId &&
        academicClass.academicYearId?._id !== formData.academicYearId
      ) {
        return false;
      }

      return true;
    });
  }, [classes, formData.academicYearId, formData.branch, formData.departmentId]);

  const selectedClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === formData.classId),
    [classes, formData.classId]
  );

  const subjectSemesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: selectedClass,
        classes: filteredClasses,
        currentValue: formData.semester,
      }),
    [filteredClasses, formData.semester, selectedClass]
  );

  const stats = useMemo(
    () => [
      { label: "Matieres", value: subjects.length },
      {
        label: "Actives",
        value: subjects.filter((subject) => subject.status === "active").length,
      },
      {
        label: "Credits cumules",
        value: subjects.reduce(
          (total, subject) => total + Number(subject.credits || 0),
          0
        ),
      },
    ],
    [subjects]
  );

  const filteredListBranches = useMemo(() => {
    if (!filters.departmentId) {
      return branches;
    }

    return branches.filter(
      (branch) => branch.departmentId?._id === filters.departmentId
    );
  }, [branches, filters.departmentId]);

  const filteredListClasses = useMemo(() => {
    return classes.filter((academicClass) => {
      if (
        filters.departmentId &&
        academicClass.departmentId?._id !== filters.departmentId
      ) {
        return false;
      }

      if (filters.branchId && academicClass.branchId?._id !== filters.branchId) {
        return false;
      }

      if (
        filters.academicYearId &&
        academicClass.academicYearId?._id !== filters.academicYearId
      ) {
        return false;
      }

      return true;
    });
  }, [classes, filters.academicYearId, filters.branchId, filters.departmentId]);

  const visibleSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch = filters.search
        ? [subject.name, subject.code, subject.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesYear = filters.academicYearId
        ? subject.academicYearId?._id === filters.academicYearId
        : true;
      const matchesDepartment = filters.departmentId
        ? subject.departmentId?._id === filters.departmentId
        : true;
      const matchesBranch = filters.branchId
        ? subject.branch?._id === filters.branchId
        : true;
      const matchesClass = filters.classId
        ? subject.classId?._id === filters.classId
        : true;
      const matchesStatus = filters.status
        ? subject.status === filters.status
        : true;

      return (
        matchesSearch &&
        matchesYear &&
        matchesDepartment &&
        matchesBranch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [filters, subjects]);

  const fetchSubjects = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/subject", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSubjects([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Erreur lors du chargement des matieres"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedSubjectId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.name ||
      !formData.code ||
      !formData.branch ||
      !formData.semester ||
      !formData.credits
    ) {
      toast.error("Veuillez remplir le nom, le code, la filiere, le semestre et les credits");
      return;
    }

    try {
      toast.loading(
        isEditing ? "Mise a jour de la matiere..." : "Ajout de la matiere..."
      );

      const response = isEditing
        ? await axiosWrapper.patch(`/subject/${selectedSubjectId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axiosWrapper.post("/subject", formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        refreshOptions();
        fetchSubjects();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage de la matiere...");
      const response = await axiosWrapper.delete(`/subject/${selectedSubjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchSubjects();
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
          title="Gestion des matieres"
          subtitle="Reliez chaque matiere a une filiere, une classe, un departement et une annee academique."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvelle matiere
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
          <h2 className="section-title">Affiner les matieres</h2>
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
              placeholder="Nom, code ou description"
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
                  classId: "",
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
                  classId: "",
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
            <label className="field-label">Classe</label>
            <select
              value={filters.classId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  classId: event.target.value,
                }))
              }
            >
              <option value="">Toutes</option>
              {filteredListClasses.map((academicClass) => (
                <option key={academicClass._id} value={academicClass._id}>
                  {getAcademicClassLabel(academicClass)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 filter-grid-2">
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
          <Loading label="Chargement des matieres..." />
        </div>
      ) : subjects.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucune matiere"
            description="Ajoutez vos matieres pour le calcul des notes, la gestion des ressources et des frais."
          />
        </div>
      ) : visibleSubjects.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucune matiere ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Matiere</th>
                <th className="px-5 py-4 text-left">Structure</th>
                <th className="px-5 py-4 text-left">Credits</th>
                <th className="px-5 py-4 text-left">Statut</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubjects.map((subject) => (
                <tr key={subject._id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{subject.name}</p>
                    <p className="text-xs text-slate-500">{subject.code}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{subject.departmentId?.name || "Sans departement"}</p>
                    <p>{subject.branch?.name || "Sans filiere"}</p>
                    <p>{getAcademicClassLabel(subject.classId)}</p>
                    <p>{subject.academicYearId?.name || "Annee active"}</p>
                    <p>{formatSemesterLabel(subject.semester)}</p>
                  </td>
                  <td className="px-5 py-4">{subject.credits}</td>
                  <td className="px-5 py-4">{getStatusLabel(subject.status)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => {
                          setFormData({
                            name: subject.name || "",
                            code: subject.code || "",
                            branch: subject.branch?._id || "",
                            departmentId: subject.departmentId?._id || "",
                            classId: subject.classId?._id || "",
                            academicYearId: subject.academicYearId?._id || "",
                            semester: subject.semester || "",
                            credits: subject.credits || "",
                            status: subject.status || "active",
                          });
                          setSelectedSubjectId(subject._id);
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
                          setSelectedSubjectId(subject._id);
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
                {isEditing ? "Modifier la matiere" : "Ajouter une matiere"}
              </h2>
              <p className="section-subtitle">
                Associez la matiere au bon departement, a la bonne filiere et a la bonne classe.
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
                  title="Rattachement academique"
                  subtitle="Associez la matiere au bon departement, a la filiere, a la classe et au semestre."
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
                        branch: "",
                        classId: "",
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
                    value={formData.branch}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        branch: event.target.value,
                        classId: "",
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
                      <label className="field-label">Classe</label>
                  <select
                    value={formData.classId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        classId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Aucune</option>
                    {filteredClasses.map((academicClass) => (
                      <option key={academicClass._id} value={academicClass._id}>
                        {getAcademicClassLabel(academicClass)}
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
                        {subjectSemesterOptions.map((semester) => (
                          <option key={semester} value={semester}>
                            {formatSemesterLabel(semester)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Credits</label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        credits: event.target.value,
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
        title="Archiver cette matiere ?"
        message="La matiere ne sera plus visible dans les listes actives mais son historique sera conserve."
      />
    </div>
  );
};

export default Subject;
