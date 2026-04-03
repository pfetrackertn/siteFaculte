import React, { useCallback, useEffect, useState } from "react";
import { MdLink } from "react-icons/md";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";
import axiosWrapper from "../../utils/AxiosWrapper";
import toast from "react-hot-toast";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";
import {
  getAcademicClassLabel,
  getMaterialTypeLabel,
} from "../../utils/displayText";

const Material = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const userData = useSelector((state) => state.userData);
  const [filters, setFilters] = useState({
    subject: "",
    type: "",
  });

  const branchId = userData?.branchId?._id;
  const semester = userData?.semester;
  const classId = userData?.classId?._id;

  const fetchSubjects = useCallback(async () => {
    if (!semester || !branchId) {
      setSubjects([]);
      return;
    }

    try {
      setDataLoading(true);
      const response = await axiosWrapper.get(
        `/subject?semester=${semester}&branch=${branchId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      if (error && error.response && error.response.status === 404) {
        setSubjects([]);
        return;
      }
      toast.error(error?.response?.data?.message || "Impossible de charger les matieres");
    } finally {
      setDataLoading(false);
    }
  }, [branchId, semester]);

  const fetchMaterials = useCallback(async () => {
    if (!semester || !branchId) {
      setMaterials([]);
      return;
    }

    try {
      setDataLoading(true);
      const queryParams = new URLSearchParams({
        semester,
        branch: branchId,
      });

      if (filters.subject) queryParams.append("subject", filters.subject);
      if (filters.type) queryParams.append("type", filters.type);
      if (classId) queryParams.append("classId", classId);

      const response = await axiosWrapper.get(`/material?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (response.data.success) {
        setMaterials(response.data.data);
      }
    } catch (error) {
      if (error && error.response && error.response.status === 404) {
        setMaterials([]);
        return;
      }
      toast.error(error?.response?.data?.message || "Impossible de charger les ressources");
    } finally {
      setDataLoading(false);
    }
  }, [branchId, classId, filters, semester]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10">
      <Heading title="Ressources pedagogiques" />

      {!dataLoading && (
        <div className="w-full mt-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrer par matiere
              </label>
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les matieres</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrer par type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="notes">Notes de cours</option>
                <option value="assignment">Devoir</option>
                <option value="syllabus">Programme</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {dataLoading && <Loading />}

      {!dataLoading && (
        <div className="w-full mt-8 overflow-x-auto">
          <table className="text-sm min-w-full bg-white">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="py-4 px-6 text-left font-semibold">Fichier</th>
                <th className="py-4 px-6 text-left font-semibold">Titre</th>
                <th className="py-4 px-6 text-left font-semibold">Matiere</th>
                <th className="py-4 px-6 text-left font-semibold">Classe</th>
                <th className="py-4 px-6 text-left font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {materials && materials.length > 0 ? (
                materials.map((material) => (
                  <tr key={material._id} className="border-b hover:bg-blue-50">
                    <td className="py-4 px-6">
                      <CustomButton
                        variant="primary"
                        onClick={() => {
                          window.open(
                            `${process.env.REACT_APP_MEDIA_LINK}/${material.file}`
                          );
                        }}
                      >
                        <MdLink className="text-xl" />
                      </CustomButton>
                    </td>
                    <td className="py-4 px-6">{material.title}</td>
                    <td className="py-4 px-6">{material.subject.name}</td>
                    <td className="py-4 px-6">
                      {material.classId
                        ? getAcademicClassLabel(material.classId)
                        : "Generale"}
                    </td>
                    <td className="py-4 px-6">{getMaterialTypeLabel(material.type)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-base pt-10">
                    Aucune ressource trouvee.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Material;
