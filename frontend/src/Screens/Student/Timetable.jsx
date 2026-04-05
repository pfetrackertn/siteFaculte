import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiDownload } from "react-icons/fi";
import { useSelector } from "react-redux";
import Heading from "../../components/Heading";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import SectionCard from "../../components/SectionCard";
import CustomButton from "../../components/CustomButton";
import axiosWrapper from "../../utils/AxiosWrapper";
import {
  formatSemesterLabel,
  getAcademicClassLabel,
} from "../../utils/displayText";

const Timetable = () => {
  const [timetable, setTimetable] = useState("");
  const [timetableDetails, setTimetableDetails] = useState(null);
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const getTimetable = async () => {
      if (!userData?.semester || !userData?.branchId?._id) {
        setTimetable("");
        setTimetableDetails(null);
        return;
      }

      try {
        setDataLoading(true);
        const queryParams = new URLSearchParams({
          semester: userData.semester,
          branch: userData.branchId?._id,
        });

        if (userData.classId?._id) {
          queryParams.append("classId", userData.classId._id);
        }

        const response = await axiosWrapper.get(`/timetable?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });
        if (response.data.success && response.data.data.length > 0) {
          setTimetable(response.data.data[0].link);
          setTimetableDetails(response.data.data[0]);
        } else {
          setTimetable("");
          setTimetableDetails(null);
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          setTimetable("");
          setTimetableDetails(null);
          return;
        }
        toast.error(
          error.response?.data?.message ||
            "Erreur lors du chargement de l'emploi du temps"
        );
      } finally {
        setDataLoading(false);
      }
    };

    getTimetable();
  }, [userData, userData?.branchId?._id, userData?.semester]);

  const downloadTimetable = () => {
    window.open(process.env.REACT_APP_MEDIA_LINK + "/" + timetable);
  };

  const stats = useMemo(
    () => [
      {
        label: "Semestre",
        value: formatSemesterLabel(userData?.semester),
      },
      {
        label: "Classe",
        value: getAcademicClassLabel(userData?.classId),
      },
      {
        label: "Disponibilite",
        value: timetable ? "Disponible" : "En attente",
      },
    ],
    [timetable, userData?.classId, userData?.semester]
  );

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title={`Emploi du temps de ${formatSemesterLabel(userData.semester)}`}
          subtitle={`Classe : ${getAcademicClassLabel(userData.classId)}`}
        />
        {!dataLoading && timetable ? (
          <CustomButton
            onClick={downloadTimetable}
            className="module-action-button"
          >
            Telecharger
            <FiDownload className="text-base" />
          </CustomButton>
        ) : null}
      </div>

      <div className="metric-grid">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`metric-card ${
              index === 0
                ? "metric-card-primary"
                : index === 1
                ? "metric-card-success"
                : "metric-card-warning"
            }`}
          >
            <p className="metric-label">{stat.label}</p>
            <p className="metric-value text-xl sm:text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Contexte</p>
          <h2 className="section-title">Filtres academiques appliques</h2>
          <p className="section-subtitle">
            Votre emploi du temps est affiche selon votre filiere, votre classe
            et votre semestre actifs.
          </p>
        </div>
        <div className="mt-5 filter-grid-3">
          <div className="field-group">
            <label className="field-label">Filiere</label>
            <input value={userData?.branchId?.name || ""} readOnly />
          </div>
          <div className="field-group">
            <label className="field-label">Semestre</label>
            <input value={formatSemesterLabel(userData?.semester)} readOnly />
          </div>
          <div className="field-group">
            <label className="field-label">Classe</label>
            <input value={getAcademicClassLabel(userData?.classId)} readOnly />
          </div>
        </div>
      </div>

      {dataLoading ? (
        <Loading label="Chargement de l'emploi du temps..." />
      ) : timetable ? (
        <SectionCard className="overflow-hidden px-6 py-6 sm:px-8">
          <div className="section-header">
            <p className="section-kicker">Organisation</p>
            <h2 className="section-title">Document du semestre</h2>
            <p className="section-subtitle">
              {timetableDetails?.classId
                ? `Document specifique a la classe ${getAcademicClassLabel(
                    timetableDetails.classId
                  )}.`
                : "Document general du semestre."}
            </p>
          </div>

          <div className="upload-preview mt-6">
            <img
              className="mx-auto w-full max-w-4xl rounded-[22px] object-cover shadow-sm"
              src={process.env.REACT_APP_MEDIA_LINK + "/" + timetable}
              alt="emploi du temps"
            />
          </div>
        </SectionCard>
      ) : (
        <NoData
          title="Aucun emploi du temps disponible"
          description="L'emploi du temps du semestre apparaitra ici des qu'il sera publie."
        />
      )}
    </div>
  );
};

export default Timetable;
