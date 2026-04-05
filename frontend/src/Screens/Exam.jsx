import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { MdEdit, MdOutlineDelete } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { FiUpload } from "react-icons/fi";
import { useSelector } from "react-redux";
import CustomButton from "../components/CustomButton";
import DeleteConfirm from "../components/DeleteConfirm";
import Heading from "../components/Heading";
import Loading from "../components/Loading";
import NoData from "../components/NoData";
import StatusBadge from "../components/StatusBadge";
import axiosWrapper from "../utils/AxiosWrapper";
import { getExamTypeLabel } from "../utils/displayText";
import { getSemesterOptions } from "../utils/semesterOptions";

const INITIAL_FORM_DATA = {
  name: "",
  date: "",
  semester: "",
  examType: "mid",
  timetableLink: "",
  totalMarks: "",
};

const Exam = () => {
  const [data, setData] = useState(INITIAL_FORM_DATA);
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const userData = useSelector((state) => state.userData);
  const loginType = localStorage.getItem("userType");
  const [processLoading, setProcessLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    semester: "",
    examType: "",
  });
  const semesterOptions = useMemo(
    () => getSemesterOptions({ currentValue: data.semester }),
    [data.semester]
  );

  const canManageExams = loginType !== "Student";

  const visibleExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch = filters.search
        ? [exam.name, exam.timetableLink]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesSemester = filters.semester
        ? Number(exam.semester) === Number(filters.semester)
        : true;
      const matchesType = filters.examType
        ? exam.examType === filters.examType
        : true;

      return matchesSearch && matchesSemester && matchesType;
    });
  }, [exams, filters]);

  const stats = useMemo(
    () => [
      { label: "Examens", value: exams.length },
      {
        label: "Partiels",
        value: exams.filter((exam) => exam.examType === "mid").length,
      },
      {
        label: "Examens finaux",
        value: exams.filter((exam) => exam.examType === "end").length,
      },
    ],
    [exams]
  );

  const getExamsHandler = useCallback(async () => {
    try {
      setDataLoading(true);
      let link = "/exam";
      if (userData.semester) {
        link = `/exam?semester=${userData.semester}`;
      }
      const response = await axiosWrapper.get(link, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (response.data.success) {
        setExams(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setExams([]);
        return;
      }
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des examens"
      );
    } finally {
      setDataLoading(false);
    }
  }, [userData.semester]);

  useEffect(() => {
    getExamsHandler();
  }, [getExamsHandler]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const resetForm = () => {
    setData(INITIAL_FORM_DATA);
    setFile(null);
    setShowModal(false);
    setIsEditing(false);
    setSelectedExamId(null);
  };

  const addExamHandler = async () => {
    if (
      !data.name ||
      !data.date ||
      !data.semester ||
      !data.examType ||
      !data.totalMarks
    ) {
      toast.dismiss();
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      setProcessLoading(true);
      toast.loading(
        isEditing ? "Mise a jour de l'examen" : "Ajout de l'examen"
      );
      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      };
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("date", data.date);
      formData.append("semester", data.semester);
      formData.append("examType", data.examType);
      formData.append("totalMarks", data.totalMarks);

      if (file) {
        formData.append("file", file);
      }

      const response = isEditing
        ? await axiosWrapper.patch(`/exam/${selectedExamId}`, formData, {
            headers,
          })
        : await axiosWrapper.post("/exam", formData, {
            headers,
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        getExamsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    } finally {
      setProcessLoading(false);
    }
  };

  const editExamHandler = (exam) => {
    setData({
      name: exam.name,
      date: new Date(exam.date).toISOString().split("T")[0],
      semester: exam.semester,
      examType: exam.examType,
      timetableLink: exam.timetableLink,
      totalMarks: exam.totalMarks,
    });
    setSelectedExamId(exam._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Suppression de l'examen");
      const response = await axiosWrapper.delete(`/exam/${selectedExamId}`, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success("L'examen a ete supprime avec succes");
        setIsDeleteConfirmOpen(false);
        getExamsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Suppression impossible");
    }
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Details des examens"
          subtitle="Consultez la planification des examens et gerez les sessions lorsque votre role l'autorise."
        />
        {canManageExams && !dataLoading ? (
          <CustomButton
            onClick={() => setShowModal(true)}
            className="module-action-button"
          >
            <IoMdAdd className="text-xl" />
            Nouvel examen
          </CustomButton>
        ) : null}
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
          <h2 className="section-title">Affiner les examens</h2>
        </div>
        <div className="mt-5 filter-grid-3">
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
              placeholder="Nom ou document"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Semestre</label>
            <select
              value={filters.semester}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  semester: event.target.value,
                }))
              }
            >
              <option value="">Tous</option>
              {semesterOptions.map((sem) => (
                <option key={sem} value={sem}>
                  Semestre {sem}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Type</label>
            <select
              value={filters.examType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  examType: event.target.value,
                }))
              }
            >
              <option value="">Tous</option>
              <option value="mid">Partiel</option>
              <option value="end">Examen final</option>
            </select>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <Loading label="Chargement des examens..." />
      ) : exams.length === 0 ? (
        <NoData
          title="Aucun examen trouve"
          description="Les sessions d'examen apparaitront ici des qu'elles seront programmees."
        />
      ) : visibleExams.length === 0 ? (
        <NoData
          title="Aucun resultat"
          description="Aucun examen ne correspond aux filtres selectionnes."
        />
      ) : (
        <div className="table-shell">
          <div className="table-toolbar">
            <div className="section-header">
              <p className="section-kicker">Planification</p>
              <h2 className="section-title">Examens disponibles</h2>
              <p className="section-subtitle">
                Vue unifiee des examens par semestre, type et note maximale.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Nom de l'examen</th>
                  <th>Date</th>
                  <th>Semestre</th>
                  <th>Type</th>
                  <th>Note maximale</th>
                  {canManageExams ? <th className="text-center">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibleExams.map((item) => (
                  <tr key={item._id}>
                    <td className="font-semibold text-slate-900">{item.name}</td>
                    <td>{new Date(item.date).toLocaleDateString("fr-FR")}</td>
                    <td>Semestre {item.semester}</td>
                    <td>
                      <StatusBadge
                        tone={item.examType === "mid" ? "warning" : "primary"}
                      >
                        {getExamTypeLabel(item.examType)}
                      </StatusBadge>
                    </td>
                    <td>{item.totalMarks}</td>
                    {canManageExams ? (
                      <td>
                        <div className="table-action-group">
                          <CustomButton
                            variant="secondary"
                            className="!p-2.5"
                            onClick={() => editExamHandler(item)}
                          >
                            <MdEdit />
                          </CustomButton>
                          <CustomButton
                            variant="danger"
                            className="!p-2.5"
                            onClick={() => {
                              setIsDeleteConfirmOpen(true);
                              setSelectedExamId(item._id);
                            }}
                          >
                            <MdOutlineDelete />
                          </CustomButton>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-2xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing ? "Modifier l'examen" : "Ajouter un examen"}
                </h2>
                <p className="section-subtitle">
                  Renseignez le semestre, le type d'examen, la date et la note
                  maximale.
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

            <div className="modal-body">
              <div className="space-y-5">
                <div className="field-group">
                  <label className="field-label">Nom de l'examen</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(event) =>
                      setData({ ...data, name: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">Date</label>
                    <input
                      type="date"
                      value={data.date}
                      onChange={(event) =>
                        setData({ ...data, date: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Semestre</label>
                    <select
                      name="semester"
                      value={data.semester}
                      onChange={(event) =>
                        setData({ ...data, semester: event.target.value })
                      }
                      required
                    >
                      <option value="">Choisir un semestre</option>
                      {semesterOptions.map((sem) => (
                        <option key={sem} value={sem}>
                          Semestre {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">Type d'examen</label>
                    <select
                      value={data.examType}
                      onChange={(event) =>
                        setData({ ...data, examType: event.target.value })
                      }
                      required
                    >
                      <option value="mid">Partiel</option>
                      <option value="end">Examen final</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Note maximale</label>
                    <input
                      type="number"
                      value={data.totalMarks}
                      onChange={(event) =>
                        setData({ ...data, totalMarks: event.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    Fichier de l'emploi du temps
                  </label>
                  <label className="upload-field cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <FiUpload />
                      {file ? file.name : "Choisir un fichier"}
                    </span>
                    <span className="badge badge-neutral">
                      {isEditing ? "Optionnel" : "Requis"}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      required={!isEditing}
                    />
                  </label>
                </div>

                <div className="modal-footer">
                  <CustomButton onClick={resetForm} variant="secondary">
                    Annuler
                  </CustomButton>
                  <CustomButton
                    onClick={addExamHandler}
                    disabled={processLoading}
                  >
                    {isEditing ? "Modifier l'examen" : "Ajouter l'examen"}
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Voulez-vous vraiment supprimer cet examen ?"
      />
    </div>
  );
};

export default Exam;
