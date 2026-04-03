import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import axiosWrapper from "../utils/AxiosWrapper";
import Heading from "../components/Heading";
import DeleteConfirm from "../components/DeleteConfirm";
import CustomButton from "../components/CustomButton";
import { FiUpload } from "react-icons/fi";
import { useSelector } from "react-redux";
import Loading from "../components/Loading";
import { getExamTypeLabel } from "../utils/displayText";

const Exam = () => {
  const [data, setData] = useState({
    name: "",
    date: "",
    semester: "",
    examType: "mid",
    timetableLink: "",
    totalMarks: "",
  });
  const [exams, setExams] = useState();
  const [showModal, setShowModal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const userData = useSelector((state) => state.userData);
  const loginType = localStorage.getItem("userType");
  const [processLoading, setProcessLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const getExamsHandler = useCallback(async () => {
    try {
      setDataLoading(true);
      let link = "/exam";
      if (userData.semester) {
        link = `/exam?semester=${userData.semester}`;
      }
      const response = await axiosWrapper.get(link, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (response.data.success) {
        setExams(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setExams([]);
        return;
      }
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des examens"
      );
    } finally {
      setDataLoading(false);
    }
  }, [userData.semester]);

  useEffect(() => {
    getExamsHandler();
  }, [getExamsHandler]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const addExamHandler = async () => {
    if (
      !data.name ||
      !data.date ||
      !data.semester ||
      !data.examType ||
      !data.totalMarks
    ) {
      toast.dismiss();
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    try {
      setProcessLoading(true);
      toast.loading(
        isEditing ? "Mise a jour de l'examen" : "Ajout de l'examen"
      );
      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      };
      let response;
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("date", data.date);
      formData.append("semester", data.semester);
      formData.append("examType", data.examType);
      formData.append("totalMarks", data.totalMarks);
      if (isEditing) {
        formData.append("file", file);
        response = await axiosWrapper.patch(
          `/exam/${selectedExamId}`,
          formData,
          {
            headers,
          }
        );
      } else {
        formData.append("file", file);
        response = await axiosWrapper.post(`/exam`, formData, {
          headers,
        });
      }
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        getExamsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response.data.message);
    } finally {
      setProcessLoading(false);
    }
  };

  const resetForm = () => {
    setData({
      name: "",
      date: "",
      semester: "",
      examType: "mid",
      timetableLink: "",
      totalMarks: "",
    });
    setShowModal(false);
    setIsEditing(false);
    setSelectedExamId(null);
  };

  const deleteExamHandler = async (id) => {
    setIsDeleteConfirmOpen(true);
    setSelectedExamId(id);
  };

  const editExamHandler = (exam) => {
    setData({
      name: exam.name,
      date: new Date(exam.date).toISOString().split("T")[0],
      semester: exam.semester,
      examType: exam.examType,
      timetableLink: exam.timetableLink,
      totalMarks: exam.totalMarks,
    });
    setSelectedExamId(exam._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Suppression de l'examen");
      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      };
      const response = await axiosWrapper.delete(`/exam/${selectedExamId}`, {
        headers,
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success("L'examen a ete supprime avec succes");
        setIsDeleteConfirmOpen(false);
        getExamsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10">
      <div className="flex justify-between items-center w-full">
        <Heading title="Details des examens" />
        {!dataLoading && loginType !== "Student" && (
          <CustomButton onClick={() => setShowModal(true)}>
            <IoMdAdd className="text-2xl" />
          </CustomButton>
        )}
      </div>

      {!dataLoading ? (
        <div className="mt-8 w-full">
          <table className="text-sm min-w-full bg-white">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="py-4 px-6 text-left font-semibold">
                  Nom de l'examen
                </th>
                <th className="py-4 px-6 text-left font-semibold">Date</th>
                <th className="py-4 px-6 text-left font-semibold">Semestre</th>
                <th className="py-4 px-6 text-left font-semibold">
                  Type d'examen
                </th>
                <th className="py-4 px-6 text-left font-semibold">
                  Note maximale
                </th>
                {loginType !== "Student" && (
                  <th className="py-4 px-6 text-center font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {exams && exams.length > 0 ? (
                exams.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-blue-50">
                    <td className="py-4 px-6">{item.name}</td>
                    <td className="py-4 px-6">
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 px-6">{item.semester}</td>
                    <td className="py-4 px-6">
                      {getExamTypeLabel(item.examType)}
                    </td>
                    <td className="py-4 px-6">{item.totalMarks}</td>
                    {loginType !== "Student" && (
                      <td className="py-4 px-6 text-center flex justify-center gap-4">
                        <CustomButton
                          variant="secondary"
                          className="!p-2"
                          onClick={() => editExamHandler(item)}
                        >
                          <MdEdit />
                        </CustomButton>
                        <CustomButton
                          variant="danger"
                          className="!p-2"
                          onClick={() => deleteExamHandler(item._id)}
                        >
                          <MdOutlineDelete />
                        </CustomButton>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-base pt-10">
                    Aucun examen trouve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <Loading />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Modifier l'examen" : "Ajouter un examen"}
              </h2>
              <CustomButton onClick={resetForm} variant="secondary">
                <AiOutlineClose size={24} />
              </CustomButton>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'examen
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => setData({ ...data, date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semestre
                  </label>
                  <select
                    name="semester"
                    value={data.semester}
                    onChange={(e) =>
                      setData({ ...data, semester: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choisir un semestre</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semestre {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'examen
                  </label>
                  <select
                    value={data.examType}
                    onChange={(e) =>
                      setData({ ...data, examType: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="mid">Partiel</option>
                    <option value="end">Examen final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note maximale
                  </label>
                  <input
                    type="number"
                    value={data.totalMarks}
                    onChange={(e) =>
                      setData({ ...data, totalMarks: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier de l'emploi du temps
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
                    <span className="flex items-center justify-center">
                      <FiUpload className="mr-2" />
                      {file ? file.name : "Choisir un fichier"}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      required={!isEditing}
                    />
                  </label>
                  {file && (
                    <CustomButton
                      onClick={() => setFile(null)}
                      variant="danger"
                      className="!p-2"
                    >
                      <AiOutlineClose size={20} />
                    </CustomButton>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <CustomButton onClick={resetForm} variant="secondary">
                  Annuler
                </CustomButton>
                <CustomButton
                  onClick={addExamHandler}
                  disabled={processLoading}
                >
                  {isEditing ? "Modifier l'examen" : "Ajouter l'examen"}
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Voulez-vous vraiment supprimer cet examen ?"
      />
    </div>
  );
};

export default Exam;
