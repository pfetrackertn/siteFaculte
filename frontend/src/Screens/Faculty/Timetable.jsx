import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MdOutlineDelete, MdEdit, MdLink } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import Heading from "../../components/Heading";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import DeleteConfirm from "../../components/DeleteConfirm";
import CustomButton from "../../components/CustomButton";
import {
  formatSemesterLabel,
  getAcademicClassLabel,
} from "../../utils/displayText";

const AddTimetableModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  branches,
  classes,
}) => {
  const [formData, setFormData] = useState({
    branch: initialData?.branch || "",
    semester: initialData?.semester || "",
    classId: initialData?.classId || "",
    file: null,
    previewUrl: initialData?.file || "",
  });

  useEffect(() => {
    setFormData({
      branch: initialData?.branch || "",
      semester: initialData?.semester || "",
      classId: initialData?.classId || "",
      file: null,
      previewUrl: initialData?.file || "",
    });
  }, [initialData, isOpen]);

  const filteredClasses = useMemo(() => {
    return classes.filter((academicClass) => {
      if (formData.branch && academicClass.branchId?._id !== formData.branch) {
        return false;
      }

      if (
        formData.semester &&
        Number(academicClass.semester) !== Number(formData.semester)
      ) {
        return false;
      }

      return true;
    });
  }, [classes, formData.branch, formData.semester]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    setFormData({
      ...formData,
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {initialData ? "Modifier l'emploi du temps" : "Ajouter un emploi du temps"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoMdClose className="text-3xl" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-2">Filiere</label>
            <select
              value={formData.branch}
              onChange={(e) =>
                setFormData({ ...formData, branch: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="">Choisir une filiere</option>
              {branches?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Semestre</label>
            <select
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="">Choisir un semestre</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  {formatSemesterLabel(sem)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Classe</label>
            <select
              value={formData.classId}
              onChange={(e) =>
                setFormData({ ...formData, classId: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="">Aucune classe specifique</option>
              {filteredClasses.map((academicClass) => (
                <option key={academicClass._id} value={academicClass._id}>
                  {getAcademicClassLabel(academicClass)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Fichier de l'emploi du temps</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>

          {formData.previewUrl && (
            <div className="mt-4">
              <img
                src={formData.previewUrl}
                alt="Apercu"
                className="max-w-full h-auto"
              />
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <CustomButton variant="secondary" onClick={onClose}>
              Annuler
            </CustomButton>
            <CustomButton variant="primary" onClick={handleSubmit}>
              {initialData ? "Modifier" : "Ajouter"}
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timetable = () => {
  const [branch, setBranch] = useState([]);
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const userToken = localStorage.getItem("userToken");

  const getBranchHandler = useCallback(async () => {
    try {
      const response = await axiosWrapper.get(`/branch`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setBranch(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erreur lors du chargement des filieres");
    }
  }, [userToken]);

  const getTimetablesHandler = useCallback(async () => {
    try {
      const response = await axiosWrapper.get(`/timetable`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (response.data.success) {
        setTimetables(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Impossible de charger les emplois du temps"
      );
    }
  }, [userToken]);

  const getClassesHandler = useCallback(async () => {
    try {
      const response = await axiosWrapper.get(`/class`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
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
        error.response?.data?.message || "Erreur lors du chargement des classes"
      );
    }
  }, [userToken]);

  useEffect(() => {
    getBranchHandler();
    getTimetablesHandler();
    getClassesHandler();
  }, [getBranchHandler, getClassesHandler, getTimetablesHandler]);

  const handleSubmitTimetable = async (formData) => {
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${userToken}`,
    };

    const submitData = new FormData();
    submitData.append("branch", formData.branch);
    submitData.append("semester", formData.semester);
    submitData.append("classId", formData.classId);
    if (formData.file) {
      submitData.append("file", formData.file);
    }

    try {
      toast.loading(
        editingTimetable
          ? "Mise a jour de l'emploi du temps"
          : "Ajout de l'emploi du temps"
      );

      let response;
      if (editingTimetable) {
        response = await axiosWrapper.put(
          `/timetable/${editingTimetable._id}`,
          submitData,
          { headers }
        );
      } else {
        response = await axiosWrapper.post("/timetable", submitData, {
          headers,
        });
      }

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        getTimetablesHandler();
        setShowAddModal(false);
        setEditingTimetable(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          "Une erreur est survenue avec l'emploi du temps"
      );
    }
  };

  const deleteTimetableHandler = async (id) => {
    setIsDeleteConfirmOpen(true);
    setSelectedTimetableId(id);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Suppression de l'emploi du temps");
      const response = await axiosWrapper.delete(
        `/timetable/${selectedTimetableId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      toast.dismiss();
      if (response.data.success) {
        toast.success("Emploi du temps supprime avec succes");
        setIsDeleteConfirmOpen(false);
        getTimetablesHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer l'emploi du temps"
      );
    }
  };

  const editTimetableHandler = (timetable) => {
    setEditingTimetable({
      _id: timetable._id,
      branch: timetable.branch?._id || "",
      semester: timetable.semester,
      classId: timetable.classId?._id || "",
      file: timetable.link
        ? `${process.env.REACT_APP_MEDIA_LINK}/${timetable.link}`
        : "",
    });
    setShowAddModal(true);
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 relative">
      <div className="flex justify-between items-center w-full">
        <Heading title="Gestion des emplois du temps" />
        <CustomButton onClick={() => setShowAddModal(true)}>
          <IoMdAdd className="text-2xl" />
        </CustomButton>
      </div>

      <div className="mt-8 w-full">
        <table className="text-sm min-w-full bg-white">
          <thead>
              <tr className="bg-blue-500 text-white">
              <th className="py-4 px-6 text-left font-semibold">Voir</th>
              <th className="py-4 px-6 text-left font-semibold">Filiere</th>
              <th className="py-4 px-6 text-left font-semibold">Semestre</th>
              <th className="py-4 px-6 text-left font-semibold">Classe</th>
              <th className="py-4 px-6 text-left font-semibold">Cree le</th>
              <th className="py-4 px-6 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timetables.map((item, index) => (
              <tr key={index} className="border-b hover:bg-blue-50">
                <td className="py-4 px-6">
                  <a
                    className="text-xl"
                    href={process.env.REACT_APP_MEDIA_LINK + "/" + item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MdLink />
                  </a>
                </td>
                <td className="py-4 px-6">{item.branch.name}</td>
                <td className="py-4 px-6">{formatSemesterLabel(item.semester)}</td>
                <td className="py-4 px-6">
                  {item.classId ? getAcademicClassLabel(item.classId) : "Generale"}
                </td>
                <td className="py-4 px-6">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-center flex justify-center gap-4">
                  <CustomButton
                    variant="secondary"
                    onClick={() => editTimetableHandler(item)}
                  >
                    <MdEdit />
                  </CustomButton>
                  <CustomButton
                    variant="danger"
                    onClick={() => deleteTimetableHandler(item._id)}
                  >
                    <MdOutlineDelete />
                  </CustomButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddTimetableModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTimetable(null);
        }}
        onSubmit={handleSubmitTimetable}
        initialData={editingTimetable}
        branches={branch}
        classes={classes}
      />

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Voulez-vous vraiment supprimer cet emploi du temps ?"
      />
    </div>
  );
};

export default Timetable;
