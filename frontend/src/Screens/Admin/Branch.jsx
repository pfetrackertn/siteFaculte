import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import axiosWrapper from "../../utils/AxiosWrapper";
import Heading from "../../components/Heading";
import DeleteConfirm from "../../components/DeleteConfirm";
import CustomButton from "../../components/CustomButton";
import FormSection from "../../components/FormSection";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import useAcademicOptions from "../../hooks/useAcademicOptions";
import { getStatusLabel } from "../../utils/displayText";

const INITIAL_FORM_DATA = {
  name: "",
  branchId: "",
  departmentId: "",
  description: "",
  status: "active",
};

const Branch = () => {
  const token = localStorage.getItem("userToken");
  const { departments, refreshOptions } = useAcademicOptions();
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showModal, setShowModal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    status: "",
  });

  const fetchBranches = useCallback(async () => {
    setDataLoading(true);
    try {
      const response = await axiosWrapper.get("/branch", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setBranches(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setBranches([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Erreur lors du chargement des filieres"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const stats = useMemo(
    () => [
      { label: "Filieres", value: branches.length },
      {
        label: "Departements",
        value: new Set(
          branches.map((branch) => branch.departmentId?._id).filter(Boolean)
        ).size,
      },
      {
        label: "Actives",
        value: branches.filter((branch) => branch.status === "active").length,
      },
    ],
    [branches]
  );

  const visibleBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesSearch = filters.search
        ? [branch.name, branch.branchId, branch.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesDepartment = filters.departmentId
        ? branch.departmentId?._id === filters.departmentId
        : true;
      const matchesStatus = filters.status
        ? branch.status === filters.status
        : true;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [branches, filters]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setSelectedBranchId(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.branchId) {
      toast.error("Le nom et l'identifiant de la filiere sont requis");
      return;
    }

    try {
      toast.loading(
        isEditing ? "Mise a jour de la filiere..." : "Ajout de la filiere..."
      );
      const response = isEditing
        ? await axiosWrapper.patch(`/branch/${selectedBranchId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        : await axiosWrapper.post("/branch", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        refreshOptions();
        fetchBranches();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage de la filiere...");
      const response = await axiosWrapper.delete(`/branch/${selectedBranchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchBranches();
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
          title="Gestion des filieres"
          subtitle="Rattachez les filieres aux departements et structurez les parcours pedagogiques."
        />
        <CustomButton
          onClick={() => setShowModal(true)}
          className="module-action-button"
        >
          <IoMdAdd className="text-xl" />
          Nouvelle filiere
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
          <h2 className="section-title">Affiner les filieres</h2>
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
              placeholder="Nom, code ou description"
            />
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
          <Loading label="Chargement des filieres..." />
        </div>
      ) : branches.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucune filiere"
            description="Ajoutez vos filieres pour ensuite organiser les classes, promotions et matieres."
          />
        </div>
      ) : visibleBranches.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucune filiere ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Filiere</th>
                <th className="px-5 py-4 text-left">Departement</th>
                <th className="px-5 py-4 text-left">Statut</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleBranches.map((branch) => (
                <tr key={branch._id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{branch.name}</p>
                    <p className="text-xs text-slate-500">{branch.branchId}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {branch.description || "Sans description"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {branch.departmentId?.name || "Aucun departement"}
                  </td>
                  <td className="px-5 py-4">{getStatusLabel(branch.status)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => {
                          setFormData({
                            name: branch.name || "",
                            branchId: branch.branchId || "",
                            departmentId: branch.departmentId?._id || "",
                            description: branch.description || "",
                            status: branch.status || "active",
                          });
                          setSelectedBranchId(branch._id);
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
                          setSelectedBranchId(branch._id);
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
                  {isEditing ? "Modifier la filiere" : "Ajouter une filiere"}
                </h2>
                <p className="section-subtitle">
                  Renseignez le code, le departement et la description de la
                  filiere.
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
                  title="Informations de la filiere"
                  subtitle="Regroupez le nom, le code, le departement et la description dans un seul bloc lisible."
                >
                  <div className="space-y-5">
                    <div className="form-grid">
                      <div className="field-group">
                        <label className="field-label">Nom de la filiere</label>
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
                      <div className="field-group">
                        <label className="field-label">Code / identifiant</label>
                        <input
                          type="text"
                          value={formData.branchId}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              branchId: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="form-grid">
                      <div className="field-group">
                        <label className="field-label">Departement</label>
                        <select
                          value={formData.departmentId}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              departmentId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Aucun</option>
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
        title="Archiver cette filiere ?"
        message="Elle sera retiree des listes actives et pourra etre restauree plus tard."
      />
    </div>
  );
};

export default Branch;
