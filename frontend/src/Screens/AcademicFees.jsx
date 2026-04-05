import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { MdEdit, MdOutlineDelete } from "react-icons/md";
import Heading from "../components/Heading";
import CustomButton from "../components/CustomButton";
import DeleteConfirm from "../components/DeleteConfirm";
import FormSection from "../components/FormSection";
import Loading from "../components/Loading";
import NoData from "../components/NoData";
import axiosWrapper from "../utils/AxiosWrapper";
import useAcademicOptions from "../hooks/useAcademicOptions";
import {
  formatAmount,
  formatLongDate,
  getAcademicClassLabel,
  getStatusLabel,
} from "../utils/displayText";

const INITIAL_FORM_DATA = {
  feeType: "",
  amount: "",
  description: "",
  dueDate: "",
  academicYearId: "",
  departmentId: "",
  branchId: "",
  classId: "",
  status: "active",
};

const AcademicFees = () => {
  const token = localStorage.getItem("userToken");
  const userType = (localStorage.getItem("userType") || "").toLowerCase();
  const isAdmin = userType === "admin";
  const { academicYears, departments, branches, classes, refreshOptions } =
    useAcademicOptions();
  const [fees, setFees] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    academicYearId: "",
    departmentId: "",
    status: "",
  });

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

  const visibleFees = useMemo(() => {
    return fees.filter((fee) => {
      const matchesSearch = filters.search
        ? [fee.feeType, fee.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      const matchesYear = filters.academicYearId
        ? fee.academicYearId?._id === filters.academicYearId
        : true;
      const matchesDepartment = filters.departmentId
        ? fee.departmentId?._id === filters.departmentId
        : true;
      const matchesStatus = filters.status ? fee.status === filters.status : true;

      return matchesSearch && matchesYear && matchesDepartment && matchesStatus;
    });
  }, [fees, filters]);

  const stats = useMemo(
    () => [
      { label: "Frais", value: fees.length },
      {
        label: "Actifs",
        value: fees.filter((fee) => fee.status === "active").length,
      },
      {
        label: "Inactifs",
        value: fees.filter((fee) => fee.status === "inactive").length,
      },
    ],
    [fees]
  );

  const fetchFees = useCallback(async () => {
    try {
      setDataLoading(true);
      const endpoint = isAdmin ? "/academic-fee" : "/academic-fee/student";
      const response = await axiosWrapper.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFees(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setFees([]);
        return;
      }

      toast.error(
        error.response?.data?.message || "Impossible de charger les frais"
      );
    } finally {
      setDataLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowModal(false);
    setIsEditing(false);
    setSelectedFeeId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.feeType || !formData.amount || !formData.dueDate) {
      toast.error("Le type, le montant et la date limite sont requis");
      return;
    }

    try {
      toast.loading(isEditing ? "Mise a jour du frais..." : "Creation du frais...");

      const response = isEditing
        ? await axiosWrapper.patch(`/academic-fee/${selectedFeeId}`, formData, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axiosWrapper.post("/academic-fee", formData, {
            headers: { Authorization: `Bearer ${token}` },
          });

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        refreshOptions();
        fetchFees();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Operation impossible");
    }
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Archivage du frais...");
      const response = await axiosWrapper.delete(`/academic-fee/${selectedFeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setIsDeleteConfirmOpen(false);
        fetchFees();
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
          title={isAdmin ? "Frais academiques" : "Mes frais academiques"}
          subtitle={
            isAdmin
              ? "Definissez les frais par annee academique, departement, filiere ou classe."
              : "Consultez les frais qui s'appliquent a votre classe, votre filiere et votre annee academique."
          }
        />
        {isAdmin ? (
          <CustomButton
            onClick={() => setShowModal(true)}
            className="module-action-button"
          >
            <IoMdAdd className="text-xl" />
            Nouveau frais
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
          <h2 className="section-title">Affiner les frais</h2>
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
              placeholder="Type ou description"
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
          <Loading label="Chargement des frais academiques..." />
        </div>
      ) : fees.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun frais academique"
            description="Les frais disponibles apparaitront ici."
          />
        </div>
      ) : visibleFees.length === 0 ? (
        <div className="mt-8">
          <NoData
            title="Aucun resultat"
            description="Aucun frais ne correspond aux filtres selectionnes."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleFees.map((fee) => (
            <article
              key={fee._id}
              className="panel-section flex h-full flex-col px-6 py-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                    {fee.academicYearId?.name || "Annee active"}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {fee.feeType}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {getStatusLabel(fee.status)}
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">
                {formatAmount(fee.amount)}
              </p>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">
                {fee.description || "Aucune description fournie."}
              </p>
              <div className="mt-5 space-y-1 text-sm text-slate-500">
                <p>Date limite : {formatLongDate(fee.dueDate)}</p>
                <p>Departement : {fee.departmentId?.name || "Tous"}</p>
                <p>Filiere : {fee.branchId?.name || "Toutes"}</p>
                <p>Classe : {getAcademicClassLabel(fee.classId)}</p>
              </div>
              {isAdmin ? (
                <div className="mt-5 flex justify-end gap-2">
                  <CustomButton
                    variant="secondary"
                    className="!p-2"
                    onClick={() => {
                      setFormData({
                        feeType: fee.feeType || "",
                        amount: fee.amount || "",
                        description: fee.description || "",
                        dueDate: fee.dueDate?.split("T")[0] || "",
                        academicYearId: fee.academicYearId?._id || "",
                        departmentId: fee.departmentId?._id || "",
                        branchId: fee.branchId?._id || "",
                        classId: fee.classId?._id || "",
                        status: fee.status || "active",
                      });
                      setSelectedFeeId(fee._id);
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
                      setSelectedFeeId(fee._id);
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    <MdOutlineDelete />
                  </CustomButton>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {showModal ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-3xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">
                  {isEditing ? "Modifier le frais" : "Ajouter un frais"}
                </h2>
                <p className="section-subtitle">
                  Utilisez le montant en francs congolais et rattachez le
                  frais au bon contexte academique.
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
                  title="Informations du frais"
                  subtitle="Regroupez le type, le montant, la date limite et les rattachements academiques dans une meme fiche."
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Type de frais
                      </label>
                      <input
                        type="text"
                        value={formData.feeType}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            feeType: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Montant
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Date limite
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            dueDate: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      />
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
                        <option value="">Tous</option>
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
                        <option value="">Toutes</option>
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
                        <option value="">Toutes</option>
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
        title="Archiver ce frais ?"
        message="Le frais disparaitra des listes actives et restera restaurable depuis les archives."
      />
    </div>
  );
};

export default AcademicFees;
