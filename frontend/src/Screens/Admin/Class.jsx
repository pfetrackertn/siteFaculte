import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { MdEdit, MdOutlineDelete } from "react-icons/md";
import Heading from "../../components/Heading";
import CustomButton from "../../components/CustomButton";
import DeleteConfirm from "../../components/DeleteConfirm";
import Loading from "../../components/Loading";
import NoData from "../../components/NoData";
import axiosWrapper from "../../utils/AxiosWrapper";
import {
  formatSemesterLabel,
  getStatusLabel,
} from "../../utils/displayText";

const INITIAL_FORM_DATA = {
  name: "",
  code: "",
  branchId: "",
  semester: "",
  capacity: "",
  description: "",
  status: "active",
};

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const userToken = localStorage.getItem("userToken");

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axiosWrapper.get("/branch", {
        headers: { Authorization: `Bearer ${userToken}` },
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
        error.response?.data?.message || "Impossible de charger les filieres"
      );
    }
  }, [userToken]);

  const fetchClasses = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await axiosWrapper.get("/class", {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setClasses([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Impossible de charger les classes"
      );
    } finally {
      setDataLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchBranches();
    fetchClasses();
  }, [fetchBranches, fetchClasses]);

  const stats = useMemo(() => {
    const activeClasses = classes.filter(
      (academicClass) => academicClass.status === "active"
    ).length;

    return [
      {
        label: "Classes",
        value: classes.length,
      },
      {
        label: "Actives",
        value: activeClasses,
      },
      {
        label: "Filieres couvertes",
        value: new Set(classes.map((academicClass) => academicClass.branchId?._id))
          .size,
      },
    ];
  }, [classes]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedClassId(null);
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(true);
    setIsEditing(false);
    setSelectedClassId(null);
  };

  const handleEdit = (academicClass) => {
    setFormData({
      name: academicClass.name || "",
      code: academicClass.code || "",
      branchId: academicClass.branchId?._id || "",
      semester: academicClass.semester || "",
      capacity: academicClass.capacity || "",
      description: academicClass.description || "",
      status: academicClass.status || "active",
    });
    setSelectedClassId(academicClass._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.code || !formData.branchId || !formData.semester) {
      toast.error("Veuillez renseigner le nom, le code, la filiere et le semestre");
      return;
    }

    try {
      setDataLoading(true);
      toast.loading(
        isEditing ? "Mise a jour de la classe..." : "Ajout de la classe..."
      );

      const requestConfig = {
        headers: { Authorization: `Bearer ${userToken}` },
      };

      const response = isEditing
        ? await axiosWrapper.patch(`/class/${selectedClassId}`, formData, requestConfig)
        : await axiosWrapper.post("/class", formData, requestConfig);

      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        fetchClasses();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation echouee");
    } finally {
      setDataLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDataLoading(true);
      toast.loading("Suppression de la classe...");

      const response = await axiosWrapper.delete(`/class/${selectedClassId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchClasses();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Suppression impossible");
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div className="w-full px-2 py-6 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Heading
          title="Gestion des classes"
          subtitle="Structurez les promotions, groupes ou cohortes par filiere et semestre."
        />
        {branches.length > 0 && (
          <CustomButton onClick={openCreateModal}>
            <IoMdAdd className="text-xl" />
            Nouvelle classe
          </CustomButton>
        )}
      </div>

      {branches.length === 0 && !dataLoading ? (
        <div className="mt-8">
          <NoData
            title="Aucune filiere disponible"
            description="Ajoutez d'abord une filiere avant de creer des classes."
          />
        </div>
      ) : null}

      {branches.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="panel-section px-5 py-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {dataLoading && !showModal ? (
        <div className="mt-8">
          <Loading label="Chargement des classes..." />
        </div>
      ) : null}

      {!dataLoading && branches.length > 0 && classes.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucune classe enregistree"
            description="Creez votre premiere classe pour structurer les groupes d'etudiants."
          />
        </div>
      ) : null}

      {!dataLoading && classes.length > 0 ? (
        <div className="table-shell mt-8 overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Classe</th>
                <th>Filiere</th>
                <th>Semestre</th>
                <th>Capacite</th>
                <th>Statut</th>
                <th>Creee le</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((academicClass) => (
                <tr key={academicClass._id}>
                  <td>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {academicClass.name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {academicClass.code}
                      </p>
                    </div>
                  </td>
                  <td>{academicClass.branchId?.name || "Non renseignee"}</td>
                  <td>{formatSemesterLabel(academicClass.semester)}</td>
                  <td>{academicClass.capacity || "-"}</td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {getStatusLabel(academicClass.status)}
                    </span>
                  </td>
                  <td>
                    {new Date(academicClass.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <CustomButton
                        variant="secondary"
                        className="!rounded-xl !p-2.5"
                        onClick={() => handleEdit(academicClass)}
                        title="Modifier la classe"
                      >
                        <MdEdit />
                      </CustomButton>
                      <CustomButton
                        variant="danger"
                        className="!rounded-xl !p-2.5"
                        onClick={() => {
                          setSelectedClassId(academicClass._id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        title="Supprimer la classe"
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
      ) : null}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditing ? "Modifier la classe" : "Ajouter une classe"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Definissez le groupe, la filiere, le semestre et la capacite d'accueil.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <IoMdClose className="text-3xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nom de la classe
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="Ex. Licence 2 - Groupe A"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(event) => handleChange("code", event.target.value)}
                    placeholder="L2-A"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Filiere
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(event) => handleChange("branchId", event.target.value)}
                  >
                    <option value="">Choisir une filiere</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Semestre
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(event) => handleChange("semester", event.target.value)}
                  >
                    <option value="">Choisir un semestre</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester} value={semester}>
                        {formatSemesterLabel(semester)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Capacite
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(event) => handleChange("capacity", event.target.value)}
                    placeholder="40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(event) => handleChange("status", event.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={(event) => handleChange("description", event.target.value)}
                  placeholder="Informations utiles sur cette classe, sa specialite ou son organisation."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-5">
                <CustomButton variant="secondary" onClick={resetForm}>
                  Annuler
                </CustomButton>
                <CustomButton type="submit">
                  {isEditing ? "Enregistrer" : "Creer la classe"}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Voulez-vous vraiment supprimer cette classe ?"
      />
    </div>
  );
};

export default Classes;
