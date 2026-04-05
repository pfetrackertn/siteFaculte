import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineClose } from "react-icons/ai";
import { FiEdit2, FiTrash2, FiUpload } from "react-icons/fi";
import { IoMdAdd } from "react-icons/io";
import { MdLink } from "react-icons/md";
import CustomButton from "../../components/CustomButton";
import DeleteConfirm from "../../components/DeleteConfirm";
import Heading from "../../components/Heading";
import NoData from "../../components/NoData";
import StatusBadge from "../../components/StatusBadge";
import axiosWrapper from "../../utils/AxiosWrapper";
import {
  formatSemesterLabel,
  getAcademicClassLabel,
  getMaterialTypeLabel,
} from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const INITIAL_FORM_DATA = {
  title: "",
  subject: "",
  semester: "",
  branch: "",
  classId: "",
  type: "notes",
};

const Material = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [file, setFile] = useState(null);
  const [filters, setFilters] = useState({
    subject: "",
    semester: "",
    branch: "",
    classId: "",
    type: "",
  });
  const userToken = localStorage.getItem("userToken");

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await axiosWrapper.get("/subject", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSubjects([]);
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Impossible de charger les matieres"
        );
      }
    }
  }, [userToken]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axiosWrapper.get("/branch", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setBranches([]);
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Impossible de charger les filieres"
        );
      }
    }
  }, [userToken]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await axiosWrapper.get("/class", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setClasses([]);
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Impossible de charger les classes"
        );
      }
    }
  }, [userToken]);

  const fetchMaterials = useCallback(async () => {
    try {
      setDataLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axiosWrapper.get(`/material?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setMaterials(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setMaterials([]);
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Impossible de charger les ressources"
        );
      }
    } finally {
      setDataLoading(false);
    }
  }, [filters, userToken]);

  useEffect(() => {
    fetchSubjects();
    fetchBranches();
    fetchClasses();
  }, [fetchBranches, fetchClasses, fetchSubjects]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredFormClasses = useMemo(
    () =>
      classes.filter((academicClass) => {
        if (formData.branch && academicClass.branchId?._id !== formData.branch) {
          return false;
        }

        if (
          formData.semester &&
          Number(academicClass.semester) !== Number(formData.semester)
        ) {
          return false;
        }

        return true;
      }),
    [classes, formData.branch, formData.semester]
  );

  const filteredClasses = useMemo(
    () =>
      classes.filter((academicClass) => {
        if (filters.branch && academicClass.branchId?._id !== filters.branch) {
          return false;
        }

        if (
          filters.semester &&
          Number(academicClass.semester) !== Number(filters.semester)
        ) {
          return false;
        }

        return true;
      }),
    [classes, filters.branch, filters.semester]
  );

  const selectedFormClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === formData.classId),
    [classes, formData.classId]
  );

  const selectedFilterClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === filters.classId),
    [classes, filters.classId]
  );

  const formSemesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: selectedFormClass,
        classes: filteredFormClasses,
        currentValue: formData.semester,
      }),
    [filteredFormClasses, formData.semester, selectedFormClass]
  );

  const filterSemesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: selectedFilterClass,
        classes: filteredClasses,
        currentValue: filters.semester,
      }),
    [filteredClasses, filters.semester, selectedFilterClass]
  );

  const stats = useMemo(
    () => [
      { label: "Ressources", value: materials.length },
      {
        label: "Matieres",
        value: new Set(materials.map((material) => material.subject?._id).filter(Boolean))
          .size,
      },
      {
        label: "Types",
        value: new Set(materials.map((material) => material.type).filter(Boolean)).size,
      },
    ],
    [materials]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "branch" || name === "semester" ? { classId: "" } : {}),
    }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "branch" || name === "semester" ? { classId: "" } : {}),
    }));
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setFile(null);
    setEditingMaterial(null);
    setShowModal(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setDataLoading(true);
    toast.loading(
      editingMaterial
        ? "Mise a jour de la ressource..."
        : "Ajout de la ressource..."
    );

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });
      if (file) {
        formDataToSend.append("file", file);
      }

      if (editingMaterial) {
        await axiosWrapper.put(`/material/${editingMaterial._id}`, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${userToken}`,
          },
        });
        toast.success("Ressource mise a jour avec succes");
      } else {
        await axiosWrapper.post("/material", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${userToken}`,
          },
        });
        toast.success("Ressource ajoutee avec succes");
      }

      resetForm();
      fetchMaterials();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Operation echouee");
    } finally {
      setDataLoading(false);
      toast.dismiss();
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      subject: material.subject._id,
      semester: material.semester,
      branch: material.branch._id,
      classId: material.classId?._id || "",
      type: material.type,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await axiosWrapper.delete(`/material/${selectedMaterialId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
      toast.success("Ressource supprimee avec succes");
      setIsDeleteConfirmOpen(false);
      fetchMaterials();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Impossible de supprimer la ressource"
      );
    }
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Gestion des ressources"
          subtitle="Diffusez des supports de cours avec une presentation unifiee pour les enseignants et les etudiants."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvelle ressource
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
          <h2 className="section-title">Affiner les ressources</h2>
        </div>
        <div className="mt-5 filter-grid-5">
          <div className="field-group">
            <label className="field-label">Matiere</label>
            <select
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
            >
              <option value="">Toutes les matieres</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Filiere</label>
            <select
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
            >
              <option value="">Toutes les filieres</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Semestre</label>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
            >
              <option value="">Tous les semestres</option>
              {filterSemesterOptions.map((sem) => (
                <option key={sem} value={sem}>
                  {formatSemesterLabel(sem)}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Classe</label>
            <select
              name="classId"
              value={filters.classId}
              onChange={handleFilterChange}
            >
              <option value="">Toutes les classes</option>
              {filteredClasses.map((academicClass) => (
                <option key={academicClass._id} value={academicClass._id}>
                  {getAcademicClassLabel(academicClass)}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">Tous les types</option>
              <option value="notes">Notes de cours</option>
              <option value="assignment">Devoir</option>
              <option value="syllabus">Programme</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="content-card">
          <p className="text-sm text-slate-500">Chargement des ressources...</p>
        </div>
      ) : materials.length === 0 ? (
        <NoData
          title="Aucune ressource trouvee"
          description="Ajoutez une premiere ressource pour enrichir la bibliotheque pedagogique."
        />
      ) : (
        <div className="table-shell">
          <div className="table-toolbar">
            <div className="section-header">
              <p className="section-kicker">Catalogue</p>
              <h2 className="section-title">Ressources publiees</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Titre</th>
                  <th>Matiere</th>
                  <th>Semestre</th>
                  <th>Filiere</th>
                  <th>Classe</th>
                  <th>Type</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material._id}>
                    <td>
                      <CustomButton
                        variant="primary"
                        className="!p-2.5"
                        onClick={() =>
                          window.open(
                            `${process.env.REACT_APP_MEDIA_LINK}/${material.file}`
                          )
                        }
                      >
                        <MdLink className="text-lg" />
                      </CustomButton>
                    </td>
                    <td className="font-semibold text-slate-900">
                      {material.title}
                    </td>
                    <td>{material.subject.name}</td>
                    <td>{formatSemesterLabel(material.semester)}</td>
                    <td>{material.branch.name}</td>
                    <td>
                      {material.classId
                        ? getAcademicClassLabel(material.classId)
                        : "Generale"}
                    </td>
                    <td>
                      <StatusBadge tone="neutral">
                        {getMaterialTypeLabel(material.type)}
                      </StatusBadge>
                    </td>
                    <td>
                      <div className="table-action-group">
                        <CustomButton
                          variant="secondary"
                          className="!p-2.5"
                          onClick={() => handleEdit(material)}
                        >
                          <FiEdit2 />
                        </CustomButton>
                        <CustomButton
                          variant="danger"
                          className="!p-2.5"
                          onClick={() => {
                            setSelectedMaterialId(material._id);
                            setIsDeleteConfirmOpen(true);
                          }}
                        >
                          <FiTrash2 />
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
                  {editingMaterial
                    ? "Modifier la ressource"
                    : "Ajouter une ressource"}
                </h2>
                <p className="section-subtitle">
                  Associez la ressource a la bonne filiere, au bon semestre et
                  eventuellement a une classe.
                </p>
              </div>
              <CustomButton
                onClick={resetForm}
                variant="secondary"
                className="!rounded-xl !p-2.5"
              >
                <AiOutlineClose size={22} />
              </CustomButton>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-5">
                <div className="field-group">
                  <label className="field-label">Titre</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">Matiere</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choisir une matiere</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Filiere</label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choisir une filiere</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Semestre</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choisir un semestre</option>
                      {formSemesterOptions.map((sem) => (
                        <option key={sem} value={sem}>
                          {formatSemesterLabel(sem)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Classe</label>
                    <select
                      name="classId"
                      value={formData.classId}
                      onChange={handleInputChange}
                    >
                      <option value="">Aucune classe specifique</option>
                      {filteredFormClasses.map((academicClass) => (
                        <option key={academicClass._id} value={academicClass._id}>
                          {getAcademicClassLabel(academicClass)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group md:col-span-2">
                    <label className="field-label">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="notes">Notes de cours</option>
                      <option value="assignment">Devoir</option>
                      <option value="syllabus">Programme</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Fichier de la ressource</label>
                  <label className="upload-field cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <FiUpload />
                      {file ? file.name : "Choisir un fichier"}
                    </span>
                    <span className="badge badge-neutral">
                      {editingMaterial ? "Optionnel" : "Requis"}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      required={!editingMaterial}
                    />
                  </label>
                </div>

                <div className="modal-footer">
                  <CustomButton type="button" onClick={resetForm} variant="secondary">
                    Annuler
                  </CustomButton>
                  <CustomButton type="submit" disabled={dataLoading}>
                    {dataLoading
                      ? "Traitement..."
                      : editingMaterial
                      ? "Modifier la ressource"
                      : "Ajouter la ressource"}
                  </CustomButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        message="Voulez-vous vraiment supprimer cette ressource ? Cette action est irreversible."
      />
    </div>
  );
};

export default Material;
