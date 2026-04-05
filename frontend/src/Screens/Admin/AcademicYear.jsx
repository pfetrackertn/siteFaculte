import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { MdEdit, MdOutlineDelete } from "react-icons/md";
import Heading from "../../components/Heading";
import CustomButton from "../../components/CustomButton";
import DeleteConfirm from "../../components/DeleteConfirm";
import FormSection from "../../components/FormSection";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import axiosWrapper from "../../utils/AxiosWrapper";
import { formatLongDate, getStatusLabel } from "../../utils/displayText";

const INITIAL_FORM_DATA = {
  name: "",
  startDate: "",
  endDate: "",
  description: "",
  status: "active",
  isActive: false,
};

const AcademicYear = () => {
  const token = localStorage.getItem("userToken");
  const [academicYears, setAcademicYears] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    activity: "",
  });

  const fetchAcademicYears = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/academic-year", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAcademicYears(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setAcademicYears([]);
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Impossible de charger les annees academiques"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  const stats = useMemo(() => {
    const activeYear = academicYears.find((year) => year.isActive);
    return [
      { label: "Annees", value: academicYears.length },
      {
        label: "Actives",
        value: academicYears.filter((year) => year.status === "active").length,
      },
      {
        label: "Courante",
        value: activeYear?.name || "Aucune",
      },
    ];
  }, [academicYears]);

  const visibleAcademicYears = useMemo(() => {
    return academicYears.filter((academicYear) => {
      const matchesSearch = filters.search
        ? [academicYear.name, academicYear.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesStatus = filters.status
        ? academicYear.status === filters.status
        : true;
      const matchesActivity =
        filters.activity === "active"
          ? academicYear.isActive
          : filters.activity === "inactive"
          ? !academicYear.isActive
          : true;

      return matchesSearch && matchesStatus && matchesActivity;
    });
  }, [academicYears, filters]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedAcademicYearId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Le nom et les dates de l'annee academique sont requis");
      return;
    }

    try {
      toast.loading(
        isEditing
          ? "Mise a jour de l'annee academique..."
          : "Creation de l'annee academique..."
      );

      const response = isEditing
        ? await axiosWrapper.patch(
            `/academic-year/${selectedAcademicYearId}`,
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        : await axiosWrapper.post("/academic-year", formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        fetchAcademicYears();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const handleActivate = async (id) => {
    try {
      toast.loading("Activation de l'annee academique...");
      const response = await axiosWrapper.patch(
        `/academic-year/${id}/activate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        fetchAcademicYears();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Activation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage de l'annee academique...");
      const response = await axiosWrapper.delete(
        `/academic-year/${selectedAcademicYearId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchAcademicYears();
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
          title="Annees academiques"
          subtitle="Gardez une seule annee active a la fois et reliez-y les classes, promotions, frais et notes."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvelle annee
        </CustomButton>
      </div>

      <div className="metric-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="panel-section px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Filtres</p>
          <h2 className="section-title">Affiner les annees</h2>
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
              placeholder="Libelle ou description"
            />
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
          <div className="field-group">
            <label className="field-label">Etat</label>
            <select
              value={filters.activity}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  activity: event.target.value,
                }))
              }
            >
              <option value="">Tous</option>
              <option value="active">Annee courante</option>
              <option value="inactive">Non courante</option>
            </select>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="mt-8">
          <Loading label="Chargement des annees academiques..." />
        </div>
      ) : academicYears.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucune annee academique"
            description="Ajoutez une premiere annee academique pour structurer la gestion du cycle."
          />
        </div>
      ) : visibleAcademicYears.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucune annee academique ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Annee</th>
                <th className="px-5 py-4 text-left">Periode</th>
                <th className="px-5 py-4 text-left">Statut</th>
                <th className="px-5 py-4 text-left">Etat</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleAcademicYears.map((academicYear) => (
                <tr
                  key={academicYear._id}
                  className="border-t border-slate-100 text-slate-700"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {academicYear.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {academicYear.description || "Sans description"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    {formatLongDate(academicYear.startDate)} -{" "}
                    {formatLongDate(academicYear.endDate)}
                  </td>
                  <td className="px-5 py-4">
                    {getStatusLabel(academicYear.status)}
                  </td>
                  <td className="px-5 py-4">
                    {academicYear.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Non active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      {!academicYear.isActive ? (
                        <CustomButton
                          variant="secondary"
                          className="!px-3 !py-2"
                          onClick={() => handleActivate(academicYear._id)}
                        >
                          Activer
                        </CustomButton>
                      ) : null}
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => {
                          setFormData({
                            name: academicYear.name || "",
                            startDate:
                              academicYear.startDate?.split("T")[0] || "",
                            endDate: academicYear.endDate?.split("T")[0] || "",
                            description: academicYear.description || "",
                            status: academicYear.status || "active",
                            isActive: Boolean(academicYear.isActive),
                          });
                          setSelectedAcademicYearId(academicYear._id);
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
                          setSelectedAcademicYearId(academicYear._id);
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
          <div className="modal-card max-w-2xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing
                    ? "Modifier l'annee academique"
                    : "Ajouter une annee academique"}
                </h2>
                <p className="section-subtitle">
                  Definissez une periode claire et choisissez si cette annee
                  devient active.
                </p>
              </div>
              <CustomButton
                variant="secondary"
                className="!rounded-xl !p-2.5"
                onClick={resetForm}
              >
                <IoMdClose className="text-2xl" />
              </CustomButton>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-6">
                <FormSection
                  title="Periode et statut"
                  subtitle="Renseignez le libelle, la periode et l'etat de l'annee academique."
                >
                  <div className="space-y-5">
                    <div className="form-grid">
                      <div className="field-group">
                        <label className="field-label">Libelle</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          placeholder="2025-2026"
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
                    <div className="form-grid">
                      <div className="field-group">
                        <label className="field-label">Date de debut</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              startDate: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Date de fin</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              endDate: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Activation"
                  subtitle="Ajoutez un contexte si besoin et choisissez si cette annee devient la reference courante."
                >
                  <div className="space-y-5">
                    <div className="field-group">
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
                        placeholder="Contexte ou remarque sur l'annee academique"
                      />
                    </div>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                      />
                      Definir cette annee comme annee active
                    </label>
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
        title="Archiver cette annee academique ?"
        message="Elle disparaitra des listes actives, mais restera restaurable depuis les archives."
      />
    </div>
  );
};

export default AcademicYear;
