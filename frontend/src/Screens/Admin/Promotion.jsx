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
import useAcademicOptions from "../../hooks/useAcademicOptions";
import { getAcademicClassLabel, getStatusLabel } from "../../utils/displayText";

const INITIAL_FORM_DATA = {
  name: "",
  code: "",
  description: "",
  intakeYear: "",
  academicYearId: "",
  departmentId: "",
  branchId: "",
  classId: "",
  status: "active",
};

const Promotion = () => {
  const token = localStorage.getItem("userToken");
  const { academicYears, departments, branches, classes, refreshOptions } =
    useAcademicOptions();
  const [promotions, setPromotions] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    academicYearId: "",
    departmentId: "",
    status: "",
  });

  const fetchPromotions = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/promotion", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPromotions(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setPromotions([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Impossible de charger les promotions"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

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
      if (formData.branchId && academicClass.branchId?._id !== formData.branchId) {
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
  }, [classes, formData.academicYearId, formData.branchId, formData.departmentId]);

  const stats = useMemo(
    () => [
      { label: "Promotions", value: promotions.length },
      {
        label: "Actives",
        value: promotions.filter((promotion) => promotion.status === "active")
          .length,
      },
      {
        label: "Cohortes",
        value: new Set(promotions.map((promotion) => promotion.intakeYear).filter(Boolean))
          .size,
      },
    ],
    [promotions]
  );

  const visiblePromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      const matchesSearch = filters.search
        ? [
            promotion.name,
            promotion.code,
            String(promotion.intakeYear || ""),
            promotion.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesYear = filters.academicYearId
        ? promotion.academicYearId?._id === filters.academicYearId
        : true;
      const matchesDepartment = filters.departmentId
        ? promotion.departmentId?._id === filters.departmentId
        : true;
      const matchesStatus = filters.status
        ? promotion.status === filters.status
        : true;

      return matchesSearch && matchesYear && matchesDepartment && matchesStatus;
    });
  }, [filters, promotions]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedPromotionId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.code || !formData.intakeYear) {
      toast.error("Le nom, le code et l'annee d'entree sont requis");
      return;
    }

    try {
      toast.loading(
        isEditing ? "Mise a jour de la promotion..." : "Creation de la promotion..."
      );

      const response = isEditing
        ? await axiosWrapper.patch(`/promotion/${selectedPromotionId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axiosWrapper.post("/promotion", formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        refreshOptions();
        fetchPromotions();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage de la promotion...");
      const response = await axiosWrapper.delete(
        `/promotion/${selectedPromotionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchPromotions();
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
          title="Promotions"
          subtitle="Regroupez les cohortes d'etudiants par annee d'entree, departement, filiere ou classe."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvelle promotion
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
          <h2 className="section-title">Affiner les promotions</h2>
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
              placeholder="Nom, code ou cohorte"
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
          <Loading label="Chargement des promotions..." />
        </div>
      ) : promotions.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucune promotion"
            description="Creez une premiere cohorte pour rattacher les etudiants a leur parcours."
          />
        </div>
      ) : visiblePromotions.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucune promotion ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Promotion</th>
                <th className="px-5 py-4 text-left">Annee / Cohorte</th>
                <th className="px-5 py-4 text-left">Structure</th>
                <th className="px-5 py-4 text-left">Statut</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePromotions.map((promotion) => (
                <tr key={promotion._id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {promotion.name}
                    </p>
                    <p className="text-xs text-slate-500">{promotion.code}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {promotion.intakeYear}
                    </p>
                    <p className="text-xs text-slate-500">
                      {promotion.academicYearId?.name || "Annee active"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p>{promotion.departmentId?.name || "Sans departement"}</p>
                    <p>{promotion.branchId?.name || "Sans filiere"}</p>
                    <p>{getAcademicClassLabel(promotion.classId)}</p>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusLabel(promotion.status)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => {
                          setFormData({
                            name: promotion.name || "",
                            code: promotion.code || "",
                            description: promotion.description || "",
                            intakeYear: promotion.intakeYear || "",
                            academicYearId: promotion.academicYearId?._id || "",
                            departmentId: promotion.departmentId?._id || "",
                            branchId: promotion.branchId?._id || "",
                            classId: promotion.classId?._id || "",
                            status: promotion.status || "active",
                          });
                          setSelectedPromotionId(promotion._id);
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
                          setSelectedPromotionId(promotion._id);
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
                  {isEditing ? "Modifier la promotion" : "Ajouter une promotion"}
                </h2>
                <p className="section-subtitle">
                  Reliez la cohorte a l'annee academique, au departement, a la
                  filiere et a la classe.
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
              <div className="modal-body">
                <FormSection
                  title="Informations de la promotion"
                  subtitle="Structurez la cohorte avec son code, son annee d'entree et ses rattachements academiques."
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Code
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            code: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Annee d'entree
                      </label>
                      <input
                        type="number"
                        value={formData.intakeYear}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            intakeYear: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Annee academique
                      </label>
                      <select
                        value={formData.academicYearId}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            academicYearId: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="">Annee active</option>
                        {academicYears.map((academicYear) => (
                          <option
                            key={academicYear._id}
                            value={academicYear._id}
                          >
                            {academicYear.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Departement
                      </label>
                      <select
                        value={formData.departmentId}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            departmentId: event.target.value,
                            branchId: "",
                            classId: "",
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="">Aucun</option>
                        {departments.map((department) => (
                          <option key={department._id} value={department._id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Filiere
                      </label>
                      <select
                        value={formData.branchId}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            branchId: event.target.value,
                            classId: "",
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="">Aucune</option>
                        {filteredBranches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Classe
                      </label>
                      <select
                        value={formData.classId}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            classId: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="">Aucune</option>
                        {filteredClasses.map((academicClass) => (
                          <option
                            key={academicClass._id}
                            value={academicClass._id}
                          >
                            {getAcademicClassLabel(academicClass)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Statut
                      </label>
                      <select
                        value={formData.status}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-5 field-group">
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
                    />
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
        title="Archiver cette promotion ?"
        message="Elle disparaitra des listes actives et restera disponible a la restauration."
      />
    </div>
  );
};

export default Promotion;
