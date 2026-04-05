import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import CustomButton from "../../components/CustomButton";
import Heading from "../../components/Heading";
import Loading from "../../components/Loading";
import SectionCard from "../../components/SectionCard";
import axiosWrapper from "../../utils/AxiosWrapper";
import { formatSemesterLabel, getExamTypeLabel } from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const AddMarks = () => {
  const [branches, setBranches] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const userToken = localStorage.getItem("userToken");
  const [subjects, setSubjects] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [masterMarksData, setMasterMarksData] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [consent, setConsent] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const semesterOptions = useMemo(
    () => getSemesterOptions({ currentValue: selectedSemester }),
    [selectedSemester]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "branch") {
      const branch = branches.find((item) => item._id === value) || null;
      setSelectedBranch(branch);
      setSelectedSubject(null);
      setSelectedExam(null);
      return;
    }

    if (name === "subject") {
      const subject = subjects.find((item) => item._id === value) || null;
      setSelectedSubject(subject);
      setSelectedExam(null);
      return;
    }

    if (name === "semester") {
      setSelectedSemester(value);
      setSelectedExam(null);
      return;
    }

    if (name === "exam") {
      const exam = exams.find((item) => item._id === value) || null;
      setSelectedExam(exam);
    }
  };

  const fetchBranches = useCallback(async () => {
    try {
      toast.loading("Chargement des filieres...");
      const response = await axiosWrapper.get("/branch", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.data.success) {
        setBranches(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setBranches([]);
      } else {
        toast.error(
          error.response?.data?.message ||
            "Impossible de charger les filieres"
        );
      }
    } finally {
      toast.dismiss();
    }
  }, [userToken]);

  const fetchSubjects = useCallback(async () => {
    if (!selectedBranch?._id) {
      setSubjects([]);
      return;
    }

    try {
      toast.loading("Chargement des matieres...");
      const response = await axiosWrapper.get(
        `/subject?branch=${selectedBranch._id}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (response.data.success) {
        setSubjects(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSubjects([]);
      } else {
        toast.error(
          error.response?.data?.message ||
            "Impossible de charger les matieres"
        );
      }
    } finally {
      toast.dismiss();
    }
  }, [selectedBranch?._id, userToken]);

  const fetchExams = useCallback(async () => {
    if (!selectedSemester) {
      setExams([]);
      return;
    }

    try {
      toast.loading("Chargement des examens...");
      const response = await axiosWrapper.get(
        `/exam?semester=${selectedSemester}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (response.data.success) {
        setExams(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setExams([]);
      } else {
        toast.error(
          error.response?.data?.message ||
            "Impossible de charger les examens"
        );
      }
    } finally {
      toast.dismiss();
    }
  }, [selectedSemester, userToken]);

  const searchStudents = async () => {
    setDataLoading(true);
    toast.loading("Recherche des etudiants...");

    try {
      const response = await axiosWrapper.get(
        `/marks/students?branch=${selectedBranch?._id}&subject=${selectedSubject?._id}&semester=${selectedSemester}&examId=${selectedExam?._id}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      toast.dismiss();
      if (response.data.success) {
        if (response.data.data.length === 0) {
          toast.error("Aucun etudiant trouve !");
          setMasterMarksData([]);
        } else {
          const initialMarksData = {};
          response.data.data.forEach((student) => {
            initialMarksData[student._id] = student.obtainedMarks || "";
          });
          setMarksData(initialMarksData);
          setMasterMarksData(response.data.data);
          setShowSearch(false);
          toast.success("Etudiants trouves !");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la recherche des etudiants"
      );
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!consent) {
      toast.error("Veuillez confirmer avant l'envoi");
      return;
    }

    const hasEmptyMarks = Object.values(marksData).some((mark) => mark === "");
    if (hasEmptyMarks) {
      toast.error("Veuillez saisir les notes de tous les etudiants");
      return;
    }

    setDataLoading(true);
    toast.loading("Envoi des notes...");
    try {
      const marksToSubmit = Object.entries(marksData).map(
        ([studentId, marks]) => ({
          studentId,
          obtainedMarks: Number(marks),
        })
      );

      const response = await axiosWrapper.post(
        "/marks/bulk",
        {
          marks: marksToSubmit,
          examId: selectedExam?._id,
          subjectId: selectedSubject?._id,
          semester: selectedSemester,
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Notes enregistrees avec succes !");
        setMarksData({});
        setConsent(false);
        setShowSearch(true);
        setMasterMarksData([]);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'envoi des notes"
      );
    } finally {
      setDataLoading(false);
      toast.dismiss();
    }
  };

  const handleBack = () => {
    setShowSearch(true);
    setMasterMarksData([]);
    setMarksData({});
    setConsent(false);
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (selectedBranch) {
      fetchSubjects();
    }
  }, [fetchSubjects, selectedBranch]);

  useEffect(() => {
    if (selectedSemester) {
      fetchExams();
    }
  }, [fetchExams, selectedSemester]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Filiere",
        value: selectedBranch?.name || "Non selectionnee",
      },
      {
        label: "Semestre",
        value: selectedSemester
          ? formatSemesterLabel(selectedSemester)
          : "Non selectionne",
      },
      {
        label: "Examen",
        value: selectedExam?.name || "Non selectionne",
      },
      {
        label: "Type d'examen",
        value: selectedExam
          ? getExamTypeLabel(selectedExam.examType)
          : "Non selectionne",
      },
      {
        label: "Matiere",
        value: selectedSubject?.name || "Non selectionnee",
      },
      {
        label: "Note totale",
        value: selectedExam?.totalMarks || "Non definie",
      },
      {
        label: "Date",
        value: selectedExam?.date
          ? new Date(selectedExam.date).toLocaleDateString("fr-FR")
          : "Non selectionnee",
      },
      {
        label: "Etudiants",
        value: masterMarksData.length || 0,
      },
    ],
    [masterMarksData.length, selectedBranch?.name, selectedExam, selectedSemester, selectedSubject?.name]
  );

  const searchStats = useMemo(
    () => [
      {
        label: "Filiere",
        value: selectedBranch?.name || "A selectionner",
      },
      {
        label: "Semestre",
        value: selectedSemester
          ? formatSemesterLabel(selectedSemester)
          : "A selectionner",
      },
      {
        label: "Matiere",
        value: selectedSubject?.name || "A selectionner",
      },
      {
        label: "Examens",
        value: exams.length,
      },
    ],
    [exams.length, selectedBranch?.name, selectedSemester, selectedSubject?.name]
  );

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Saisie des notes"
          subtitle="Selectionnez le contexte academique puis enregistrez les notes d'un groupe d'etudiants."
        />
      </div>

      <div className="metric-grid">
        {searchStats.map((item, index) => (
          <div
            key={item.label}
            className={`metric-card ${
              index === 0
                ? "metric-card-primary"
                : index === 1
                ? "metric-card-success"
                : index === 2
                ? "metric-card-warning"
                : "metric-card-neutral"
            }`}
          >
            <p className="metric-label">{item.label}</p>
            <p className="metric-value text-xl sm:text-2xl">{item.value}</p>
          </div>
        ))}
      </div>

      {showSearch ? (
        <div className="filter-card">
          <div className="section-header">
            <p className="section-kicker">Recherche</p>
            <h2 className="section-title">Selection du contexte</h2>
            <p className="section-subtitle">
              Filtrez par semestre, filiere, matiere et examen avant de lancer
              la saisie.
            </p>
          </div>

          <div className="mt-6 filter-grid">
            <div className="field-group">
              <label className="field-label">Semestre</label>
              <select
                name="semester"
                value={selectedSemester || ""}
                onChange={handleInputChange}
              >
                <option value="">Choisir un semestre</option>
                {semesterOptions.map((sem) => (
                  <option key={sem} value={sem}>
                    {formatSemesterLabel(sem)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Filiere</label>
              <select
                name="branch"
                value={selectedBranch?._id || ""}
                onChange={handleInputChange}
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
              <label className="field-label">Matiere</label>
              <select
                name="subject"
                value={selectedSubject?._id || ""}
                onChange={handleInputChange}
                disabled={!selectedBranch}
              >
                <option value="">Choisir une matiere</option>
                {subjects?.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {!selectedBranch ? (
                <p className="field-hint">
                  Veuillez d'abord choisir une filiere.
                </p>
              ) : null}
            </div>

            <div className="field-group">
              <label className="field-label">Examen</label>
              <select
                name="exam"
                value={selectedExam?._id || ""}
                onChange={handleInputChange}
                disabled={!selectedSubject}
              >
                <option value="">Choisir un examen</option>
                {exams?.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.name}
                  </option>
                ))}
              </select>
              {!selectedSubject ? (
                <p className="field-hint">
                  Veuillez d'abord choisir une matiere.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <CustomButton
              className="module-action-button"
              disabled={
                dataLoading ||
                !selectedBranch ||
                !selectedSubject ||
                !selectedExam ||
                !selectedSemester
              }
              onClick={searchStudents}
            >
              {dataLoading ? "Recherche..." : "Rechercher les etudiants"}
            </CustomButton>
          </div>
        </div>
      ) : null}

      {!showSearch && dataLoading ? (
        <Loading label="Chargement des etudiants..." />
      ) : null}

      {!showSearch && masterMarksData.length > 0 ? (
        <SectionCard className="px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="section-header">
              <p className="section-kicker">Saisie</p>
              <h2 className="section-title">Enregistrement des notes</h2>
              <p className="section-subtitle">
                Renseignez chaque note puis confirmez l'ensemble avant l'envoi.
              </p>
            </div>
            <CustomButton variant="secondary" onClick={handleBack}>
              Retour a la recherche
            </CustomButton>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <div key={item.label} className="content-card-muted">
                <p className="detail-label">{item.label}</p>
                <p className="detail-value">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {masterMarksData.map((student) => (
              <div key={student._id} className="content-card-muted">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {student.enrollmentNo}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                      Etudiant
                    </p>
                  </div>
                  <span className="badge badge-neutral">
                    / {selectedExam?.totalMarks || 0}
                  </span>
                </div>
                <div className="mt-4 field-group">
                  <label className="field-label">Note obtenue</label>
                  <input
                    type="number"
                    min={0}
                    max={selectedExam?.totalMarks || 100}
                    value={marksData[student._id] || ""}
                    placeholder="Saisir la note"
                    onChange={(event) =>
                      setMarksData({
                        ...marksData,
                        [student._id]: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-slate-200/80 pt-6">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Je confirme que toutes les notes saisies sont correctes et
                verifiees.
              </span>
            </label>

            <div className="mt-5 flex justify-end">
              <CustomButton
                disabled={dataLoading || !consent}
                onClick={handleSubmit}
              >
                {dataLoading ? "Envoi..." : "Valider les notes"}
              </CustomButton>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
};

export default AddMarks;
