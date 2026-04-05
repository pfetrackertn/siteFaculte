import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdLink } from "react-icons/md";
import { useSelector } from "react-redux";
import CustomButton from "../../components/CustomButton";
import Heading from "../../components/Heading";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import StatusBadge from "../../components/StatusBadge";
import axiosWrapper from "../../utils/AxiosWrapper";
import {
  getAcademicClassLabel,
  getMaterialTypeLabel,
} from "../../utils/displayText";

const Material = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const userData = useSelector((state) => state.userData);
  const [filters, setFilters] = useState({
    subject: "",
    type: "",
  });

  const branchId = userData?.branchId?._id;
  const semester = userData?.semester;
  const classId = userData?.classId?._id;

  const fetchSubjects = useCallback(async () => {
    if (!semester || !branchId) {
      setSubjects([]);
      return;
    }

    try {
      setDataLoading(true);
      const response = await axiosWrapper.get(
        `/subject?semester=${semester}&branch=${branchId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        setSubjects([]);
        return;
      }
      toast.error(
        error?.response?.data?.message ||
          "Impossible de charger les matieres"
      );
    } finally {
      setDataLoading(false);
    }
  }, [branchId, semester]);

  const fetchMaterials = useCallback(async () => {
    if (!semester || !branchId) {
      setMaterials([]);
      return;
    }

    try {
      setDataLoading(true);
      const queryParams = new URLSearchParams({
        semester,
        branch: branchId,
      });

      if (filters.subject) queryParams.append("subject", filters.subject);
      if (filters.type) queryParams.append("type", filters.type);
      if (classId) queryParams.append("classId", classId);

      const response = await axiosWrapper.get(`/material?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (response.data.success) {
        setMaterials(response.data.data);
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        setMaterials([]);
        return;
      }
      toast.error(
        error?.response?.data?.message ||
          "Impossible de charger les ressources"
      );
    } finally {
      setDataLoading(false);
    }
  }, [branchId, classId, filters, semester]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Ressources pedagogiques"
          subtitle="Retrouvez les supports de cours mis a disposition pour votre semestre et votre classe."
        />
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

      {!dataLoading ? (
        <div className="filter-card">
          <div className="section-header">
            <p className="section-kicker">Filtres</p>
            <h2 className="section-title">Affiner les ressources</h2>
          </div>
          <div className="mt-5 filter-grid-2">
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
      ) : null}

      {dataLoading ? (
        <Loading label="Chargement des ressources..." />
      ) : materials.length === 0 ? (
        <NoData
          title="Aucune ressource trouvee"
          description="Les ressources compatibles avec votre classe et votre semestre apparaitront ici."
        />
      ) : (
        <div className="table-shell">
          <div className="table-toolbar">
            <div className="section-header">
              <p className="section-kicker">Bibliotheque de cours</p>
              <h2 className="section-title">Documents disponibles</h2>
              <p className="section-subtitle">
                Accedez rapidement aux notes, devoirs, programmes et autres
                supports partages.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Titre</th>
                  <th>Matiere</th>
                  <th>Classe</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material._id}>
                    <td>
                      <CustomButton
                        variant="primary"
                        className="!p-2.5"
                        onClick={() => {
                          window.open(
                            `${process.env.REACT_APP_MEDIA_LINK}/${material.file}`
                          );
                        }}
                      >
                        <MdLink className="text-lg" />
                      </CustomButton>
                    </td>
                    <td className="font-semibold text-slate-900">
                      {material.title}
                    </td>
                    <td>{material.subject.name}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Material;
