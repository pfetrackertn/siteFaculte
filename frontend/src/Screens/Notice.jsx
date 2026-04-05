import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoMdAdd, IoMdClose, IoMdLink } from "react-icons/io";
import { HiOutlineCalendar } from "react-icons/hi";
import { MdDeleteOutline, MdEditNote } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CustomButton from "../components/CustomButton";
import DeleteConfirm from "../components/DeleteConfirm";
import Heading from "../components/Heading";
import Loading from "../components/Loading";
import NoData from "../components/NoData";
import axiosWrapper from "../utils/AxiosWrapper";
import { getNoticeAudienceLabel } from "../utils/displayText";

const Notice = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
  });
  const token = localStorage.getItem("userToken");
  const currentUserType = (localStorage.getItem("userType") || "").toLowerCase();
  const canManageNotices =
    router.pathname === "/faculty" || router.pathname === "/admin";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "student",
    link: "",
  });

  useEffect(() => {
    if (!token) {
      toast.error("Veuillez vous connecter pour continuer");
      navigate("/");
    }
  }, [token, navigate]);

  const getNotices = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/notice", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setNotices(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setNotices([]);
      } else {
        toast.error(
          error.response?.data?.message || "Impossible de charger les annonces"
        );
      }
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    getNotices();
  }, [getNotices]);

  const visibleNotices = useMemo(() => {
    if (currentUserType === "admin") {
      return notices;
    }

    return notices.filter(
      (notice) => notice.type === "both" || notice.type === currentUserType
    );
  }, [currentUserType, notices]);

  const filteredNotices = useMemo(() => {
    return visibleNotices.filter((notice) => {
      const matchesSearch = filters.search
        ? [notice.title, notice.description, notice.link]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesType = filters.type ? notice.type === filters.type : true;

      return matchesSearch && matchesType;
    });
  }, [filters, visibleNotices]);

  const stats = useMemo(
    () => [
      { label: "Annonces", value: notices.length },
      {
        label: "Tous publics",
        value: notices.filter((notice) => notice.type === "both").length,
      },
      {
        label: "Avec lien",
        value: notices.filter((notice) => Boolean(notice.link)).length,
      },
    ],
    [notices]
  );

  const openAddModal = () => {
    setEditingNotice(null);
    setFormData({
      title: "",
      description: "",
      type: "student",
      link: "",
    });
    setShowAddModal(true);
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || "",
      description: notice.description || "",
      type: notice.type || "student",
      link: notice.link || "",
    });
    setShowAddModal(true);
  };

  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    const { title, description, type } = formData;

    if (!title || !description || !type) {
      toast.dismiss();
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      toast.loading(
        editingNotice
          ? "Mise a jour de l'annonce"
          : "Ajout de l'annonce"
      );

      const response = await axiosWrapper[editingNotice ? "put" : "post"](
        `/notice${editingNotice ? `/${editingNotice._id}` : ""}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        await getNotices();
        setShowAddModal(false);
        setEditingNotice(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation echouee");
    }
  };

  const handleDelete = async () => {
    try {
      toast.loading("Suppression de l'annonce");
      const response = await axiosWrapper.delete(
        `/notice/${selectedNoticeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.dismiss();
      if (response.data.success) {
        toast.success("Annonce supprimee avec succes");
        setIsDeleteConfirmOpen(false);
        await getNotices();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message || "Impossible de supprimer l'annonce"
      );
    }
  };

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Annonces"
          subtitle="Consultez ou publiez les communications importantes de l'etablissement."
        />
        {canManageNotices && !dataLoading && (
          <CustomButton
            onClick={openAddModal}
            className="module-action-button"
          >
            <IoMdAdd className="text-xl" />
            Nouvelle annonce
          </CustomButton>
        )}
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
          <h2 className="section-title">Affiner les annonces</h2>
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
              placeholder="Titre, contenu ou lien"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Public</label>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
            >
              <option value="">Tous</option>
              <option value="student">Etudiants</option>
              <option value="faculty">Enseignants</option>
              <option value="both">Tous les publics</option>
            </select>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="mt-8">
          <Loading label="Chargement des annonces..." />
        </div>
      ) : visibleNotices.length === 0 ? (
        <NoData
          title="Aucune annonce disponible"
          description="Les nouvelles annonces apparaitront ici des qu'elles seront publiees."
        />
      ) : filteredNotices.length === 0 ? (
        <NoData
          title="Aucun resultat"
          description="Aucune annonce ne correspond aux filtres selectionnes."
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredNotices.map((notice) => (
            <article
              key={notice._id}
              className="group flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_-34px_rgba(37,99,235,0.35)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    {getNoticeAudienceLabel(notice.type)}
                  </span>
                  <button
                    className={`flex items-start gap-2 text-left text-xl font-bold leading-snug text-slate-900 transition ${
                      notice.link ? "hover:text-blue-600" : ""
                    }`}
                    onClick={() =>
                      notice.link && window.open(notice.link, "_blank")
                    }
                  >
                    <span>{notice.title}</span>
                    {notice.link && (
                      <IoMdLink className="mt-1 flex-shrink-0 text-lg text-blue-500" />
                    )}
                  </button>
                </div>

                {canManageNotices && (
                  <div className="flex gap-2">
                    <CustomButton
                      onClick={() => {
                        setSelectedNoticeId(notice._id);
                        setIsDeleteConfirmOpen(true);
                      }}
                      variant="danger"
                      className="!rounded-xl !p-2.5"
                      title="Supprimer l'annonce"
                    >
                      <MdDeleteOutline size={18} />
                    </CustomButton>
                    <CustomButton
                      onClick={() => handleEdit(notice)}
                      variant="secondary"
                      className="!rounded-xl !p-2.5"
                      title="Modifier l'annonce"
                    >
                      <MdEditNote size={18} />
                    </CustomButton>
                  </div>
                )}
              </div>

              <p className="mt-5 flex-1 text-sm leading-7 text-slate-600">
                {notice.description}
              </p>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <HiOutlineCalendar className="text-sm text-blue-500" />
                  <span>
                    {new Date(notice.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {notice.link ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                    Lien disponible
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-2xl">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingNotice
                    ? "Modifier l'annonce"
                    : "Ajouter une annonce"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Redigez une annonce claire et ciblee pour le bon public.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingNotice(null);
                }}
                className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <IoMdClose className="text-3xl" />
              </button>
            </div>

            <form onSubmit={handleSubmitNotice}>
              <div className="modal-body space-y-5">
                <div className="field-group">
                  <label className="field-label">
                  Titre de l'annonce
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex. Report de l'examen du semestre 4"
                />
              </div>

                <div className="field-group">
                  <label className="field-label">
                  Description de l'annonce
                </label>
                <textarea
                  rows="5"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Precisez ici les informations essentielles."
                />
              </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">
                    Public concerne
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="">Choisir le type</option>
                    <option value="student">Etudiants</option>
                    <option value="faculty">Enseignants</option>
                    <option value="both">Tous</option>
                  </select>
                </div>

                  <div className="field-group">
                    <label className="field-label">
                    Lien associe (optionnel)
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              </div>

              <div className="modal-footer">
                <CustomButton
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNotice(null);
                  }}
                >
                  Annuler
                </CustomButton>
                <CustomButton type="submit">
                  {editingNotice ? "Enregistrer" : "Publier"}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        message="Voulez-vous vraiment supprimer cette annonce ?"
      />
    </div>
  );
};

export default Notice;
