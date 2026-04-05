import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import Heading from "../../components/Heading";
import InfoItem from "../../components/InfoItem";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import SectionCard from "../../components/SectionCard";
import StatusBadge from "../../components/StatusBadge";
import axiosWrapper from "../../utils/AxiosWrapper";
import { formatAverage, formatSemesterLabel } from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const MarksCard = ({ title, marks, emptyLabel, tone = "primary" }) => (
  <SectionCard className="px-6 py-6">
    <div className="section-header">
      <p className="section-kicker">Evaluations</p>
      <h2 className="section-title">{title}</h2>
    </div>
    {marks.length > 0 ? (
      <div className="mt-5 space-y-4">
        {marks.map((mark) => (
          <div
            key={mark._id}
            className="content-card-muted flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {mark.subjectId.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">{mark.examId.name}</p>
            </div>
            <div className="text-right">
              <StatusBadge tone={tone}>{mark.marksObtained}</StatusBadge>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                sur {mark.examId.totalMarks}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty-state-compact mt-5">{emptyLabel}</div>
    )}
  </SectionCard>
);

const ViewMarks = () => {
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(
    userData?.semester || 1
  );
  const [marks, setMarks] = useState([]);
  const [summary, setSummary] = useState(null);
  const userToken = localStorage.getItem("userToken");

  const fetchMarks = useCallback(
    async (semester) => {
      setDataLoading(true);
      toast.loading("Chargement des notes...");
      try {
        const [marksResponse, summaryResponse] = await Promise.all([
          axiosWrapper.get(`/marks/student?semester=${semester}`, {
            headers: { Authorization: `Bearer ${userToken}` },
          }),
          axiosWrapper.get(`/marks/student/summary?semester=${semester}`, {
            headers: { Authorization: `Bearer ${userToken}` },
          }),
        ]);

        if (marksResponse.data.success) {
          setMarks(marksResponse.data.data);
        } else {
          toast.error(marksResponse.data.message);
        }

        if (summaryResponse.data.success) {
          setSummary(summaryResponse.data.data);
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors du chargement des notes"
        );
      } finally {
        setDataLoading(false);
        toast.dismiss();
      }
    },
    [userToken]
  );

  useEffect(() => {
    const currentSemester = userData?.semester || 1;
    setSelectedSemester(currentSemester);
    fetchMarks(currentSemester);
  }, [fetchMarks, userData?.semester]);

  const handleSemesterChange = (event) => {
    const semester = event.target.value;
    setSelectedSemester(semester);
    fetchMarks(semester);
  };

  const midTermMarks = useMemo(
    () => marks.filter((mark) => mark.examId.examType === "mid"),
    [marks]
  );
  const endTermMarks = useMemo(
    () => marks.filter((mark) => mark.examId.examType === "end"),
    [marks]
  );
  const semesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: userData?.classId,
        currentValue: selectedSemester,
      }),
    [selectedSemester, userData?.classId]
  );

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Consulter les notes"
          subtitle="Suivez vos evaluations par semestre, par type d'examen et par matiere."
        />
      </div>

      <div className="metric-grid">
        <div className="metric-card metric-card-primary">
          <p className="metric-label text-blue-700">Moyenne generale</p>
          <p className="metric-value">{formatAverage(summary?.overallAverage)}</p>
        </div>
        <div className="metric-card metric-card-success">
          <p className="metric-label text-emerald-700">Moyenne du semestre</p>
          <p className="metric-value">
            {formatAverage(summary?.semesterAverages?.[0]?.average)}
          </p>
        </div>
        <div className="metric-card metric-card-warning">
          <p className="metric-label text-amber-700">Matieres evaluees</p>
          <p className="metric-value">{summary?.subjectCount || 0}</p>
        </div>
      </div>

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Filtres</p>
          <h2 className="section-title">Choisir le semestre</h2>
        </div>
        <div className="mt-5 max-w-sm">
          <div className="field-group">
            <label className="field-label">Semestre</label>
            <select
              value={selectedSemester || ""}
              onChange={handleSemesterChange}
            >
              {semesterOptions.map((sem) => (
                <option key={sem} value={sem}>
                  {formatSemesterLabel(sem)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <Loading label="Chargement des notes..." />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <MarksCard
              title="Notes de partiel"
              marks={midTermMarks}
              tone="primary"
              emptyLabel="Aucune note de partiel disponible pour ce semestre."
            />
            <MarksCard
              title="Notes d'examen final"
              marks={endTermMarks}
              tone="success"
              emptyLabel="Aucune note d'examen final disponible pour ce semestre."
            />
          </div>

          {summary?.semesterAverages?.[0]?.subjects?.length ? (
            <SectionCard className="px-6 py-6 sm:px-8">
              <div className="section-header">
                <p className="section-kicker">Synthese</p>
                <h2 className="section-title">Resume par matiere</h2>
              </div>
              <div className="mt-5 info-grid">
                {summary.semesterAverages[0].subjects.map((subject) => (
                  <InfoItem
                    key={subject.subjectId}
                    label={subject.subjectName}
                    value={`${formatAverage(subject.average)} | Credits: ${
                      subject.credits
                    } | Evaluations: ${subject.examCount}`}
                  />
                ))}
              </div>
            </SectionCard>
          ) : (
            <NoData
              title="Aucune synthese disponible"
              description="Les moyennes par matiere apparaitront ici des que des notes seront enregistrees."
            />
          )}
        </>
      )}
    </div>
  );
};

export default ViewMarks;
