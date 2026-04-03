import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Heading from "../../components/Heading";
import axiosWrapper from "../../utils/AxiosWrapper";
import CustomButton from "../../components/CustomButton";
import NoData from "../../components/NoData";
import {
  formatLongDate,
  formatSemesterLabel,
  getAcademicClassLabel,
  getGenderLabel,
} from "../../utils/displayText";

const StudentFinder = () => {
  const [searchParams, setSearchParams] = useState({
    enrollmentNo: "",
    name: "",
    semester: "",
    branch: "",
    classId: "",
  });
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const userToken = localStorage.getItem("userToken");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        toast.loading("Chargement des filieres...");
        const response = await axiosWrapper.get("/branch", {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        if (response.data.success) {
          setBranches(response.data.data);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setBranches([]);
        } else {
          toast.error(
            error.response?.data?.message || "Impossible de charger les filieres"
          );
        }
      } finally {
        toast.dismiss();
      }
    };
    fetchBranches();
  }, [userToken]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axiosWrapper.get("/class", {
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
          error.response?.data?.message || "Impossible de charger les classes"
        );
      }
    };

    fetchClasses();
  }, [userToken]);

  const filteredClasses = useMemo(() => {
    return classes.filter((academicClass) => {
      if (searchParams.branch && academicClass.branchId?._id !== searchParams.branch) {
        return false;
      }

      if (
        searchParams.semester &&
        Number(academicClass.semester) !== Number(searchParams.semester)
      ) {
        return false;
      }

      return true;
    });
  }, [classes, searchParams.branch, searchParams.semester]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "branch" || name === "semester" ? { classId: "" } : {}),
    }));
  };

  const searchStudents = async (e) => {
    e.preventDefault();

    if (
      !searchParams.enrollmentNo &&
      !searchParams.name &&
      !searchParams.semester &&
      !searchParams.branch &&
      !searchParams.classId
    ) {
      toast.error("Veuillez selectionner au moins un filtre");
      return;
    }

    setDataLoading(true);
    setHasSearched(true);
    toast.loading("Recherche des etudiants...");
    setStudents([]);
    try {
      const response = await axiosWrapper.post(
        `/student/search`,
        searchParams,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      toast.dismiss();
      if (response.data.success) {
        if (response.data.data.length === 0) {
          toast.error("Aucun etudiant trouve !");
          setStudents([]);
        } else {
          toast.success("Etudiants trouves !");
          setStudents(response.data.data);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      if (error.response?.status !== 404) {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de la recherche des etudiants"
        );
      }
      console.error("Erreur de recherche :", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleRowClick = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10">
      <div className="flex justify-between items-center w-full">
        <Heading
          title="Recherche d'etudiants"
          subtitle="Retrouvez rapidement un etudiant par filiere, semestre ou classe."
        />
      </div>

      <div className="my-6 mx-auto w-full">
        <form onSubmit={searchStudents} className="flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 w-[90%] mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero d'inscription
              </label>
              <input
                type="text"
                name="enrollmentNo"
                value={searchParams.enrollmentNo}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Saisir le numero d'inscription"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                name="name"
                value={searchParams.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Saisir le nom de l'etudiant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
              <select
                name="semester"
                value={searchParams.semester}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filiere
              </label>
              <select
                name="branch"
                value={searchParams.branch}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choisir une filiere</option>
                  {branches?.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe
                </label>
                <select
                  name="classId"
                  value={searchParams.classId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir une classe</option>
                  {filteredClasses.map((academicClass) => (
                    <option key={academicClass._id} value={academicClass._id}>
                      {getAcademicClassLabel(academicClass)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          <div className="mt-6 flex justify-center w-[10%] mx-auto">
            <CustomButton
              type="submit"
              disabled={dataLoading}
              variant="primary"
            >
              {dataLoading ? "Recherche..." : "Rechercher"}
            </CustomButton>
          </div>
        </form>

        {!hasSearched && (
          <div className="text-center mt-8 text-gray-600 flex flex-col items-center justify-center my-10 bg-white p-10 rounded-lg mx-auto w-[40%]">
            <img
              src="/assets/filter.svg"
              alt="Choisir des filtres"
              className="w-64 h-64 mb-4"
            />
            Veuillez choisir au moins un filtre pour rechercher des etudiants
          </div>
        )}

        {hasSearched && students.length === 0 && (
          <NoData title="Aucun etudiant trouve" />
        )}

        {students.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Resultats de recherche</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 border-b text-left">Profil</th>
                    <th className="px-6 py-3 border-b text-left">Nom</th>
                    <th className="px-6 py-3 border-b text-left">
                      No inscription
                    </th>
                    <th className="px-6 py-3 border-b text-left">Semestre</th>
                    <th className="px-6 py-3 border-b text-left">Filiere</th>
                    <th className="px-6 py-3 border-b text-left">Classe</th>
                    <th className="px-6 py-3 border-b text-left">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(student)}
                    >
                      <td className="px-6 py-4 border-b">
                        <img
                          src={`${process.env.REACT_APP_MEDIA_LINK}/${student.profile}`}
                          alt={
                            [student.firstName, student.middleName, student.lastName]
                              .filter(Boolean)
                              .join(" ") || "Etudiant"
                          }
                          className="w-12 h-12 object-cover rounded-full"
                          onError={(e) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1744315900478-fa44dc6a4e89?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 border-b">
                        {student.firstName} {student.middleName}{" "}
                        {student.lastName}
                      </td>
                      <td className="px-6 py-4 border-b">
                        {student.enrollmentNo}
                      </td>
                      <td className="px-6 py-4 border-b">
                        {formatSemesterLabel(student.semester)}
                      </td>
                      <td className="px-6 py-4 border-b">
                        {student.branchId?.name}
                      </td>
                      <td className="px-6 py-4 border-b">
                        {getAcademicClassLabel(student.classId)}
                      </td>
                      <td className="px-6 py-4 border-b">{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Details de l'etudiant</h2>
                <CustomButton
                  onClick={() => setShowModal(false)}
                  variant="secondary"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </CustomButton>
              </div>

              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    src={`${process.env.REACT_APP_MEDIA_LINK}/${selectedStudent.profile}`}
                    alt={
                      [
                        selectedStudent.firstName,
                        selectedStudent.middleName,
                        selectedStudent.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ") || "Etudiant"
                    }
                    className="w-full h-auto object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1744315900478-fa44dc6a4e89?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                    }}
                  />
                </div>

                <div className="w-full md:w-2/3">
                  <h3 className="text-xl font-semibold mb-4">
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p>
                      <span className="font-medium">Nom complet :</span>{" "}
                      {selectedStudent.firstName} {selectedStudent.middleName}{" "}
                      {selectedStudent.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Genre :</span>{" "}
                      {getGenderLabel(selectedStudent.gender)}
                    </p>
                    <p>
                      <span className="font-medium">Date de naissance :</span>{" "}
                      {formatLongDate(selectedStudent.dob)}
                    </p>
                    <p>
                      <span className="font-medium">Groupe sanguin :</span>{" "}
                      {selectedStudent.bloodGroup}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Informations academiques
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">No inscription :</span>{" "}
                      {selectedStudent.enrollmentNo}
                    </p>
                    <p>
                      <span className="font-medium">Filiere :</span>{" "}
                      {selectedStudent.branchId?.name}
                    </p>
                    <p>
                      <span className="font-medium">Semestre :</span>{" "}
                      {formatSemesterLabel(selectedStudent.semester)}
                    </p>
                    <p>
                      <span className="font-medium">Classe :</span>{" "}
                      {getAcademicClassLabel(selectedStudent.classId)}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Coordonnees
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">E-mail :</span>{" "}
                      {selectedStudent.email}
                    </p>
                    <p>
                      <span className="font-medium">Telephone :</span>{" "}
                      {selectedStudent.phone}
                    </p>
                    <p>
                      <span className="font-medium">Adresse :</span>{" "}
                      {selectedStudent.address}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Localisation
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Ville :</span>{" "}
                      {selectedStudent.city}
                    </p>
                    <p>
                      <span className="font-medium">Region :</span>{" "}
                      {selectedStudent.state}
                    </p>
                    <p>
                      <span className="font-medium">Code postal :</span>{" "}
                      {selectedStudent.pincode}
                    </p>
                    <p>
                      <span className="font-medium">Pays :</span>{" "}
                      {selectedStudent.country}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Contact d'urgence
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Nom :</span>{" "}
                      {selectedStudent.emergencyContact?.name}
                    </p>
                    <p>
                      <span className="font-medium">Lien :</span>{" "}
                      {selectedStudent.emergencyContact?.relationship}
                    </p>
                    <p>
                      <span className="font-medium">Telephone :</span>{" "}
                      {selectedStudent.emergencyContact?.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFinder;
