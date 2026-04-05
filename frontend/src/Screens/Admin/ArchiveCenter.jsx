import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Heading from "../../components/Heading";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import axiosWrapper from "../../utils/AxiosWrapper";
import { getAcademicClassLabel, formatLongDate } from "../../utils/displayText";

const RESOURCE_LABELS = {
  students: "Etudiants",
  academicYears: "Annees academiques",
  classes: "Classes",
  marks: "Notes",
  notices: "Annonces",
  exams: "Examens",
};

const ArchiveCenter = () => {
  const token = localStorage.getItem("userToken");
  const [archives, setArchives] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    resource: "",
    search: "",
  });

  const fetchArchives = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/archive/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setArchives(response.data.data);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible de charger les archives"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const restoreItem = async (resource, id) => {
    try {
      toast.loading("Restauration en cours...");
      const response = await axiosWrapper.patch(
        `/archive/${resource}/${id}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        fetchArchives();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Restauration impossible");
    }
  };

  const sections = Object.entries(RESOURCE_LABELS).map(([resource, label]) => ({
    resource,
    label,
    items: archives[resource] || [],
  }));

  const stats = useMemo(() => {
    const totalItems = sections.reduce(
      (total, section) => total + section.items.length,
      0
    );

    return [
      { label: "Elements archives", value: totalItems },
      {
        label: "Rubriques actives",
        value: sections.filter((section) => section.items.length > 0).length,
      },
      {
        label: "Restaurables",
        value: totalItems,
      },
    ];
  }, [sections]);

  const visibleSections = useMemo(() => {
    return sections
      .filter((section) =>
        filters.resource ? section.resource === filters.resource : true
      )
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!filters.search) {
            return true;
          }

          return [
            item.name,
            item.title,
            item.firstName,
            item.middleName,
            item.lastName,
            item.description,
            item.studentId?.enrollmentNo,
            item.subjectId?.name,
            item.examId?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase());
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [filters, sections]);

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Centre d'archives"
          subtitle="Restaurez les etudiants, classes, annees, notes, annonces et examens archives."
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

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Filtres</p>
          <h2 className="section-title">Affiner les archives</h2>
        </div>
        <div className="mt-5 filter-grid-2">
          <div className="field-group">
            <label className="field-label">Rubrique</label>
            <select
              value={filters.resource}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  resource: event.target.value,
                }))
              }
            >
              <option value="">Toutes</option>
              {Object.entries(RESOURCE_LABELS).map(([resource, label]) => (
                <option key={resource} value={resource}>
                  {label}
                </option>
              ))}
            </select>
          </div>
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
              placeholder="Nom, etudiant, examen ou description"
            />
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="mt-8">
          <Loading label="Chargement des archives..." />
        </div>
      ) : sections.every((section) => section.items.length === 0) ? (
        <div className="mt-8">
          <NoData
            title="Aucune archive"
            description="Les elements archives apparaitront ici pour pouvoir etre restaures."
          />
        </div>
      ) : visibleSections.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucune archive ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {visibleSections.map((section) => (
            <section key={section.resource} className="panel-section px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Archives
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {section.label}
                  </h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {section.items.length} element(s)
                </span>
              </div>

              {section.items.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Aucun element archive pour cette rubrique.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name ||
                            item.title ||
                            item.studentId?.enrollmentNo ||
                            item.subjectId?.name ||
                            "Element archive"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {section.resource === "students"
                            ? `${item.firstName || ""} ${item.middleName || ""} ${
                                item.lastName || ""
                              } - ${item.branchId?.name || "Sans filiere"} - ${getAcademicClassLabel(
                                item.classId
                              )}`
                            : section.resource === "classes"
                            ? `${item.branchId?.name || "Sans filiere"} - ${
                                item.academicYearId?.name || "Sans annee"
                              }`
                            : section.resource === "marks"
                            ? `${item.studentId?.enrollmentNo || ""} - ${
                                item.subjectId?.name || ""
                              } - ${item.examId?.name || ""}`
                            : section.resource === "exams"
                            ? item.academicYearId?.name || "Sans annee"
                            : item.description || "Aucune information supplementaire"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Archive le {formatLongDate(item.archivedAt)}
                        </p>
                      </div>
                      <CustomButton
                        className="self-start sm:self-auto"
                        onClick={() => restoreItem(section.resource, item._id)}
                      >
                        Restaurer
                      </CustomButton>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveCenter;
