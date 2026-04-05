import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { MdEdit, MdOutlineDelete } from "react-icons/md";
import Heading from "../components/Heading";
import CustomButton from "../components/CustomButton";
import DeleteConfirm from "../components/DeleteConfirm";
import FileUpload from "../components/FileUpload";
import FormSection from "../components/FormSection";
import Loading from "../components/Loading";
import NoData from "../components/NoData";
import axiosWrapper from "../utils/AxiosWrapper";
import { formatLongDate, getStatusLabel, getVisibilityLabel } from "../utils/displayText";

const INITIAL_FORM_DATA = {
  title: "",
  description: "",
  category: "",
  authorName: "",
  visibility: "all",
  status: "active",
};

const Library = () => {
  const token = localStorage.getItem("userToken");
  const userType = (localStorage.getItem("userType") || "").toLowerCase();
  const canManage = userType === "admin" || userType === "faculty";
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    visibility: "",
    status: "",
  });

  const fetchItems = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/library", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setItems([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Impossible de charger la library"
      );
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  );

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = filters.search
        ? [item.title, item.description, item.authorName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesCategory = filters.category
        ? item.category === filters.category
        : true;
      const matchesVisibility = filters.visibility
        ? item.visibility === filters.visibility
        : true;
      const matchesStatus = filters.status ? item.status === filters.status : true;

      return matchesSearch && matchesCategory && matchesVisibility && matchesStatus;
    });
  }, [filters, items]);

  const stats = useMemo(
    () => [
      { label: "Documents", value: items.length },
      {
        label: "Actifs",
        value: items.filter((item) => item.status === "active").length,
      },
      {
        label: "Categories",
        value: categories.length,
      },
    ],
    [categories.length, items]
  );

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedFile(null);
    setShowModal(false);
    setIsEditing(false);
    setSelectedItemId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title || !formData.category || !formData.authorName) {
      toast.error("Le titre, la categorie et l'auteur sont requis");
      return;
    }

    if (!isEditing && !selectedFile) {
      toast.error("Veuillez ajouter un fichier pour ce document");
      return;
    }

    try {
      toast.loading(
        isEditing
          ? "Mise a jour du document..."
          : "Ajout du document dans la library..."
      );

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (selectedFile) {
        payload.append("file", selectedFile);
      }

      const response = isEditing
        ? await axiosWrapper.patch(`/library/${selectedItemId}`, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          })
        : await axiosWrapper.post("/library", payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        fetchItems();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage du document...");
      const response = await axiosWrapper.delete(`/library/${selectedItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchItems();
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
          title="Library"
          subtitle={
            canManage
              ? "Ajoutez des documents institutionnels, supports pedagogiques ou ressources de reference."
              : "Consultez et telechargez les documents autorises par l'administration et les enseignants."
          }
        />
        {canManage ? (
          <CustomButton
            onClick={() => setShowModal(true)}
            className="module-action-button"
          >
            <IoMdAdd className="text-xl" />
            Ajouter un document
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
          <h2 className="section-title">Affiner la library</h2>
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
              placeholder="Titre, auteur ou description"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Categorie</label>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            >
              <option value="">Toutes</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Visibilite</label>
            <select
              value={filters.visibility}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  visibility: event.target.value,
                }))
              }
            >
              <option value="">Toutes</option>
              <option value="all">Tous</option>
              <option value="student">Etudiants</option>
              <option value="faculty">Enseignants</option>
              <option value="admin">Administrateurs</option>
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
          <Loading label="Chargement de la library..." />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun document disponible"
            description="Les documents publics de la bibliotheque apparaitront ici."
          />
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucun document ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              key={item._id}
              className="panel-section flex h-full flex-col px-6 py-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                    {item.category}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {getVisibilityLabel(item.visibility)}
                </span>
              </div>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">
                {item.description || "Aucune description disponible."}
              </p>
              <div className="mt-5 space-y-1 text-sm text-slate-500">
                <p>Auteur : {item.authorName}</p>
                <p>Statut : {getStatusLabel(item.status)}</p>
                <p>Ajoute le : {formatLongDate(item.createdAt)}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <CustomButton
                  onClick={() =>
                    window.open(
                      `${process.env.REACT_APP_MEDIA_LINK}/${item.file}`,
                      "_blank"
                    )
                  }
                >
                  Ouvrir / Telecharger
                </CustomButton>
                {canManage ? (
                  <>
                    <CustomButton
                      variant="secondary"
                      className="!p-2"
                      onClick={() => {
                        setFormData({
                          title: item.title || "",
                          description: item.description || "",
                          category: item.category || "",
                          authorName: item.authorName || "",
                          visibility: item.visibility || "all",
                          status: item.status || "active",
                        });
                        setSelectedItemId(item._id);
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
                        setSelectedItemId(item._id);
                        setIsDeleteConfirmOpen(true);
                      }}
                    >
                      <MdOutlineDelete />
                    </CustomButton>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-2xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing ? "Modifier le document" : "Ajouter un document"}
                </h2>
                <p className="section-subtitle">
                  Centralisez les documents institutionnels dans une fiche
                  uniforme et lisible.
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
                  title="Fiche du document"
                  subtitle="Rassemblez les metadonnees, la visibilite et le fichier dans une structure unique."
                >
                  <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Categorie
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Auteur / responsable
                  </label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        authorName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Visibilite
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        visibility: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <option value="all">Tous</option>
                    <option value="student">Etudiants</option>
                    <option value="faculty">Enseignants</option>
                    <option value="admin">Administrateurs</option>
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
                  <div className="mt-5">
                    <FileUpload
                      label="Fichier"
                      hint={isEditing ? "Remplacer le document" : "Requis"}
                      required={!isEditing}
                      fileName={selectedFile?.name}
                      onChange={(event) =>
                        setSelectedFile(event.target.files?.[0] || null)
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
                  {isEditing ? "Mettre a jour" : "Ajouter"}
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
        title="Archiver ce document ?"
        message="Le document sera retire de la library active et restera restorable."
      />
    </div>
  );
};

export default Library;
