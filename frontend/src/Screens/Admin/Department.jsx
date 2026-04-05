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
import { getStatusLabel } from "../../utils/displayText";

const INITIAL_FORM_DATA = {
  name: "",
  code: "",
  description: "",
  status: "active",
};

const Department = () => {
  const token = localStorage.getItem("userToken");
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const stats = useMemo(
    () => [
      { label: "Departements", value: departments.length },
      {
        label: "Actifs",
        value: departments.filter((department) => department.status === "active")
          .length,
      },
      {
        label: "Inactifs",
        value: departments.filter((department) => department.status === "inactive")
          .length,
      },
    ],
    [departments]
  );

  const fetchDepartments = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/department", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setDepartments([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Impossible de charger les departements"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const visibleDepartments = useMemo(() => {
    return departments.filter((department) => {
      const matchesSearch = filters.search
        ? [department.name, department.code, department.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesStatus = filters.status
        ? department.status === filters.status
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [departments, filters]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedDepartmentId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error("Le nom et le code du departement sont requis");
      return;
    }

    try {
      toast.loading(
        isEditing
          ? "Mise a jour du departement..."
          : "Creation du departement..."
      );

      const response = isEditing
        ? await axiosWrapper.patch(`/department/${selectedDepartmentId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axiosWrapper.post("/department", formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        fetchDepartments();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage du departement...");
      const response = await axiosWrapper.delete(
        `/department/${selectedDepartmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchDepartments();
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
          title="Departements"
          subtitle="Structurez les grandes sections pedagogiques auxquelles seront rattachees filieres, classes et promotions."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouveau departement
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
          <h2 className="section-title">Affiner les departements</h2>
        </div>
        <div className="mt-5 filter-grid-2">
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
              placeholder="Nom, code ou description"
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
        </div>
      </div>

      {dataLoading ? (
        <div className="mt-8">
          <Loading label="Chargement des departements..." />
        </div>
      ) : departments.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun departement"
            description="Ajoutez les sections ou departements de l'etablissement."
          />
        </div>
      ) : visibleDepartments.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucun departement ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleDepartments.map((department) => (
            <article
              key={department._id}
              className="panel-section flex h-full flex-col px-6 py-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                    {department.code}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {department.name}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {getStatusLabel(department.status)}
                </span>
              </div>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">
                {department.description || "Aucune description disponible."}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <CustomButton
                  variant="secondary"
                  className="!p-2"
                  onClick={() => {
                    setFormData({
                      name: department.name || "",
                      code: department.code || "",
                      description: department.description || "",
                      status: department.status || "active",
                    });
                    setSelectedDepartmentId(department._id);
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
                    setSelectedDepartmentId(department._id);
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  <MdOutlineDelete />
                </CustomButton>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing
                    ? "Modifier le departement"
                    : "Ajouter un departement"}
                </h2>
                <p className="section-subtitle">
                  Donnez un code, un statut et une description claire au
                  departement.
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
                  title="Informations du departement"
                  subtitle="Regroupez ici le nom, le code, le statut et une courte description."
                >
                  <div className="space-y-5">
                    <div className="field-group">
                      <label className="field-label">Nom</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="form-grid">
                      <div className="field-group">
                        <label className="field-label">Code</label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              code: event.target.value,
                            }))
                          }
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
                      />
                    </div>
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
        title="Archiver ce departement ?"
        message="Le departement sera masque des listes actives et pourra etre restaure plus tard."
      />
    </div>
  );
};

export default Department;
