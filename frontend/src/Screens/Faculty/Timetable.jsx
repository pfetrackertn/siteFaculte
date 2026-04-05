import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { MdEdit, MdLink, MdOutlineDelete } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import CustomButton from "../../components/CustomButton";
import DeleteConfirm from "../../components/DeleteConfirm";
import Heading from "../../components/Heading";
import NoData from "../../components/NoData";
import StatusBadge from "../../components/StatusBadge";
import axiosWrapper from "../../utils/AxiosWrapper";
import {
  formatSemesterLabel,
  getAcademicClassLabel,
} from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const AddTimetableModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  branches,
  classes,
}) => {
  const [formData, setFormData] = useState({
    branch: initialData?.branch || "",
    semester: initialData?.semester || "",
    classId: initialData?.classId || "",
    file: null,
    previewUrl: initialData?.file || "",
  });

  useEffect(() => {
    setFormData({
      branch: initialData?.branch || "",
      semester: initialData?.semester || "",
      classId: initialData?.classId || "",
      file: null,
      previewUrl: initialData?.file || "",
    });
  }, [initialData, isOpen]);

  const filteredClasses = useMemo(
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

  const selectedClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === formData.classId),
    [classes, formData.classId]
  );

  const semesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: selectedClass,
        classes: filteredClasses,
        currentValue: formData.semester,
      }),
    [filteredClasses, formData.semester, selectedClass]
  );

  const handleFileChange = (event) => {
    const nextFile = event.target.files[0];
    if (!nextFile) {
      return;
    }

    setFormData({
      ...formData,
      file: nextFile,
      previewUrl: URL.createObjectURL(nextFile),
    });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="section-title">
              {initialData
                ? "Modifier l'emploi du temps"
                : "Ajouter un emploi du temps"}
            </h2>
            <p className="section-subtitle">
              Associez le document au bon semestre, a la bonne filiere et a la
              bonne classe si besoin.
            </p>
          </div>
          <CustomButton
            onClick={onClose}
            variant="secondary"
            className="!rounded-xl !p-2.5"
          >
            <IoMdClose className="text-2xl" />
          </CustomButton>
        </div>

        <div className="modal-body space-y-5">
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label">Filiere</label>
              <select
                value={formData.branch}
                onChange={(event) =>
                  setFormData({ ...formData, branch: event.target.value, classId: "" })
                }
              >
                <option value="">Choisir une filiere</option>
                {branches?.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Semestre</label>
              <select
                value={formData.semester}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    semester: event.target.value,
                    classId: "",
                  })
                }
              >
                <option value="">Choisir un semestre</option>
                {semesterOptions.map((sem) => (
                  <option key={sem} value={sem}>
                    {formatSemesterLabel(sem)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group md:col-span-2">
              <label className="field-label">Classe</label>
              <select
                value={formData.classId}
                onChange={(event) =>
                  setFormData({ ...formData, classId: event.target.value })
                }
              >
                <option value="">Aucune classe specifique</option>
                {filteredClasses.map((academicClass) => (
                  <option key={academicClass._id} value={academicClass._id}>
                    {getAcademicClassLabel(academicClass)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Fichier de l'emploi du temps</label>
            <label className="upload-field cursor-pointer">
              <span>{formData.file?.name || "Choisir une image"}</span>
              <span className="badge badge-neutral">
                {initialData ? "Optionnel" : "Requis"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {formData.previewUrl ? (
            <div className="upload-preview">
              <img
                src={formData.previewUrl}
                alt="Apercu"
                className="max-h-[340px] w-full rounded-[22px] object-contain"
              />
            </div>
          ) : null}

          <div className="modal-footer">
            <CustomButton variant="secondary" onClick={onClose}>
              Annuler
            </CustomButton>
            <CustomButton variant="primary" onClick={handleSubmit}>
              {initialData ? "Modifier" : "Ajouter"}
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timetable = () => {
  const [branch, setBranch] = useState([]);
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [filters, setFilters] = useState({
    branch: "",
    semester: "",
    classId: "",
  });
  const userToken = localStorage.getItem("userToken");

  const getBranchHandler = useCallback(async () => {
    try {
      const response = await axiosWrapper.get("/branch", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setBranch(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des filieres"
      );
    }
  }, [userToken]);

  const getTimetablesHandler = useCallback(async () => {
    try {
      const response = await axiosWrapper.get("/timetable", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setTimetables(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Impossible de charger les emplois du temps"
      );
    }
  }, [userToken]);

  const getClassesHandler = useCallback(async () => {
    try {
      const response = await axiosWrapper.get("/class", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
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
        error.response?.data?.message || "Erreur lors du chargement des classes"
      );
    }
  }, [userToken]);

  useEffect(() => {
    getBranchHandler();
    getTimetablesHandler();
    getClassesHandler();
  }, [getBranchHandler, getClassesHandler, getTimetablesHandler]);

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

  const selectedFilterClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === filters.classId),
    [classes, filters.classId]
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

  const visibleTimetables = useMemo(
    () =>
      timetables.filter((item) => {
        if (filters.branch && item.branch?._id !== filters.branch) {
          return false;
        }

        if (
          filters.semester &&
          Number(item.semester) !== Number(filters.semester)
        ) {
          return false;
        }

        if (filters.classId) {
          if (!item.classId?._id || item.classId._id !== filters.classId) {
            return false;
          }
        }

        return true;
      }),
    [filters.branch, filters.classId, filters.semester, timetables]
  );

  const handleSubmitTimetable = async (formData) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${userToken}`,
    };

    const submitData = new FormData();
    submitData.append("branch", formData.branch);
    submitData.append("semester", formData.semester);
    submitData.append("classId", formData.classId);
    if (formData.file) {
      submitData.append("file", formData.file);
    }

    try {
      toast.loading(
        editingTimetable
          ? "Mise a jour de l'emploi du temps"
          : "Ajout de l'emploi du temps"
      );

      const response = editingTimetable
        ? await axiosWrapper.put(
            `/timetable/${editingTimetable._id}`,
            submitData,
            { headers }
          )
        : await axiosWrapper.post("/timetable", submitData, {
            headers,
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        getTimetablesHandler();
        setShowAddModal(false);
        setEditingTimetable(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          "Une erreur est survenue avec l'emploi du temps"
      );
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Suppression de l'emploi du temps");
      const response = await axiosWrapper.delete(
        `/timetable/${selectedTimetableId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      toast.dismiss();
      if (response.data.success) {
        toast.success("Emploi du temps supprime avec succes");
        setIsDeleteConfirmOpen(false);
        getTimetablesHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer l'emploi du temps"
      );
    }
  };

  const editTimetableHandler = (timetable) => {
    setEditingTimetable({
      _id: timetable._id,
      branch: timetable.branch?._id || "",
      semester: timetable.semester,
      classId: timetable.classId?._id || "",
      file: timetable.link
        ? `${process.env.REACT_APP_MEDIA_LINK}/${timetable.link}`
        : "",
    });
    setShowAddModal(true);
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Gestion des emplois du temps"
          subtitle="Publiez des emplois du temps par semestre, filiere ou classe avec une structure uniforme."
        />
        <CustomButton
          onClick={() => setShowAddModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvel emploi du temps
        </CustomButton>
      </div>

      <div className="metric-grid">
        <div className="metric-card metric-card-primary">
          <p className="metric-label">Documents</p>
          <p className="metric-value">{timetables.length}</p>
        </div>
        <div className="metric-card metric-card-success">
          <p className="metric-label">Generaux</p>
          <p className="metric-value">
            {timetables.filter((item) => !item.classId).length}
          </p>
        </div>
        <div className="metric-card metric-card-warning">
          <p className="metric-label">Classes ciblees</p>
          <p className="metric-value">
            {timetables.filter((item) => item.classId).length}
          </p>
        </div>
      </div>

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Filtres</p>
          <h2 className="section-title">Affiner les emplois du temps</h2>
        </div>

        <div className="mt-5 filter-grid-3">
          <div className="field-group">
            <label className="field-label">Filiere</label>
            <select
              value={filters.branch}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  branch: event.target.value,
                  classId: "",
                }))
              }
            >
              <option value="">Toutes les filieres</option>
              {branch.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Semestre</label>
            <select
              value={filters.semester}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  semester: event.target.value,
                  classId: "",
                }))
              }
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
              value={filters.classId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  classId: event.target.value,
                }))
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
      </div>

      {timetables.length === 0 ? (
        <NoData
          title="Aucun emploi du temps publie"
          description="Ajoutez un premier document pour organiser les cours et les examens."
        />
      ) : visibleTimetables.length === 0 ? (
        <NoData
          title="Aucun resultat"
          description="Aucun emploi du temps ne correspond aux filtres selectionnes."
        />
      ) : (
        <div className="table-shell">
          <div className="table-toolbar">
            <div className="section-header">
              <p className="section-kicker">Documents</p>
              <h2 className="section-title">Emplois du temps disponibles</h2>
              <p className="section-subtitle">
                Consultez, modifiez ou supprimez les publications selon la
                filiere, le semestre et la classe.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Voir</th>
                  <th>Filiere</th>
                  <th>Semestre</th>
                  <th>Classe</th>
                  <th>Cree le</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTimetables.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <CustomButton
                        variant="primary"
                        className="!p-2.5"
                        onClick={() =>
                          window.open(
                            `${process.env.REACT_APP_MEDIA_LINK}/${item.link}`,
                            "_blank"
                          )
                        }
                      >
                        <MdLink className="text-lg" />
                      </CustomButton>
                    </td>
                    <td className="font-semibold text-slate-900">
                      {item.branch.name}
                    </td>
                    <td>
                      <StatusBadge tone="primary">
                        {formatSemesterLabel(item.semester)}
                      </StatusBadge>
                    </td>
                    <td>
                      {item.classId
                        ? getAcademicClassLabel(item.classId)
                        : "Generale"}
                    </td>
                    <td>
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <div className="table-action-group">
                        <CustomButton
                          variant="secondary"
                          className="!p-2.5"
                          onClick={() => editTimetableHandler(item)}
                        >
                          <MdEdit />
                        </CustomButton>
                        <CustomButton
                          variant="danger"
                          className="!p-2.5"
                          onClick={() => {
                            setIsDeleteConfirmOpen(true);
                            setSelectedTimetableId(item._id);
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

      <AddTimetableModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTimetable(null);
        }}
        onSubmit={handleSubmitTimetable}
        initialData={editingTimetable}
        branches={branch}
        classes={classes}
      />

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Voulez-vous vraiment supprimer cet emploi du temps ?"
      />
    </div>
  );
};

export default Timetable;
