import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CustomButton from "../../components/CustomButton";
import Heading from "../../components/Heading";
import InfoItem from "../../components/InfoItem";
import NoData from "../../components/NoData";
import SectionCard from "../../components/SectionCard";
import StatusBadge from "../../components/StatusBadge";
import axiosWrapper from "../../utils/AxiosWrapper";
import {
  formatAverage,
  formatLongDate,
  formatSemesterLabel,
  getAcademicClassLabel,
  getDefaultCountryLabel,
  getGenderLabel,
} from "../../utils/displayText";
import { getSemesterOptions } from "../../utils/semesterOptions";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1744315900478-fa44dc6a4e89?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

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
  const [selectedStudentSummary, setSelectedStudentSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const userToken = localStorage.getItem("userToken");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
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
            error.response?.data?.message ||
              "Impossible de charger les filieres"
          );
        }
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
          error.response?.data?.message ||
            "Impossible de charger les classes"
        );
      }
    };

    fetchClasses();
  }, [userToken]);

  const filteredClasses = useMemo(
    () =>
      classes.filter((academicClass) => {
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
      }),
    [classes, searchParams.branch, searchParams.semester]
  );

  const selectedSearchClass = useMemo(
    () => classes.find((academicClass) => academicClass._id === searchParams.classId),
    [classes, searchParams.classId]
  );

  const semesterOptions = useMemo(
    () =>
      getSemesterOptions({
        classItem: selectedSearchClass,
        classes: filteredClasses,
        currentValue: searchParams.semester,
      }),
    [filteredClasses, searchParams.semester, selectedSearchClass]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "branch" || name === "semester" ? { classId: "" } : {}),
    }));
  };

  const searchStudents = async (event) => {
    event.preventDefault();

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
      const response = await axiosWrapper.post("/student/search", searchParams, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

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
    } finally {
      setDataLoading(false);
    }
  };

  const handleRowClick = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  useEffect(() => {
    const fetchStudentSummary = async () => {
      if (!showModal || !selectedStudent?._id) {
        return;
      }

      try {
        const response = await axiosWrapper.get(
          `/marks/summary/${selectedStudent._id}`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        if (response.data.success) {
          setSelectedStudentSummary(response.data.data);
        }
      } catch (error) {
        setSelectedStudentSummary(null);
      }
    };

    fetchStudentSummary();
  }, [selectedStudent?._id, showModal, userToken]);

  const selectedStudentName = [
    selectedStudent?.firstName,
    selectedStudent?.middleName,
    selectedStudent?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const stats = useMemo(
    () => [
      { label: "Resultats", value: students.length },
      { label: "Filieres", value: branches.length },
      { label: "Classes", value: filteredClasses.length },
    ],
    [branches.length, filteredClasses.length, students.length]
  );

  return (
    <div className="screen-shell">
      <div className="action-bar">
        <Heading
          title="Recherche d'etudiants"
          subtitle="Retrouvez rapidement un etudiant par filiere, semestre ou classe."
        />
      </div>

      <div className="metric-grid">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`metric-card ${
              index === 0
                ? "metric-card-primary"
                : index === 1
                ? "metric-card-success"
                : "metric-card-warning"
            }`}
          >
            <p className="metric-label">{stat.label}</p>
            <p className="metric-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="filter-card">
        <div className="section-header">
          <p className="section-kicker">Recherche avancee</p>
          <h2 className="section-title">Choisir les filtres</h2>
          <p className="section-subtitle">
            Combinez plusieurs criteres pour cibler precisement les etudiants.
          </p>
        </div>

        <form onSubmit={searchStudents} className="mt-6 space-y-6">
          <div className="filter-grid-5">
            <div className="field-group">
              <label className="field-label">Numero d'inscription</label>
              <input
                type="text"
                name="enrollmentNo"
                value={searchParams.enrollmentNo}
                onChange={handleInputChange}
                placeholder="Saisir le numero"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Nom</label>
              <input
                type="text"
                name="name"
                value={searchParams.name}
                onChange={handleInputChange}
                placeholder="Saisir le nom"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Semestre</label>
              <select
                name="semester"
                value={searchParams.semester}
                onChange={handleInputChange}
              >
                <option value="">Choisir un semestre</option>
                {semesterOptions.map((sem) => (
                  <option key={sem} value={sem}>
                    {formatSemesterLabel(sem)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Filiere</label>
              <select
                name="branch"
                value={searchParams.branch}
                onChange={handleInputChange}
              >
                <option value="">Choisir une filiere</option>
                {branches?.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Classe</label>
              <select
                name="classId"
                value={searchParams.classId}
                onChange={handleInputChange}
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

          <div className="flex justify-end">
            <CustomButton
              type="submit"
              disabled={dataLoading}
              className="module-action-button"
            >
              {dataLoading ? "Recherche..." : "Rechercher"}
            </CustomButton>
          </div>
        </form>
      </div>

      {!hasSearched ? (
        <div className="empty-state-panel">
          <img
            src="/assets/filter.svg"
            alt="Choisir des filtres"
            className="mx-auto h-52 w-52 object-contain"
          />
          <p className="mt-4 text-lg font-semibold text-slate-700">
            Choisissez au moins un filtre
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            La recherche s'active des que vous renseignez un ou plusieurs
            criteres.
          </p>
        </div>
      ) : null}

      {hasSearched && students.length === 0 ? (
        <NoData title="Aucun etudiant trouve" />
      ) : null}

      {students.length > 0 ? (
        <div className="table-shell">
          <div className="table-toolbar">
            <div className="section-header">
              <p className="section-kicker">Resultats</p>
              <h2 className="section-title">Etudiants trouves</h2>
              <p className="section-subtitle">
                Cliquez sur une ligne pour consulter le profil detaille.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Profil</th>
                  <th>Nom</th>
                  <th>No inscription</th>
                  <th>Semestre</th>
                  <th>Filiere</th>
                  <th>Classe</th>
                  <th>E-mail</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(student)}
                  >
                    <td>
                      <img
                        src={`${process.env.REACT_APP_MEDIA_LINK}/${student.profile}`}
                        alt={
                          [
                            student.firstName,
                            student.middleName,
                            student.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ") || "Etudiant"
                        }
                        className="table-avatar"
                        onError={(event) => {
                          event.target.src = FALLBACK_IMAGE;
                        }}
                      />
                    </td>
                    <td className="font-semibold text-slate-900">
                      {student.firstName} {student.middleName} {student.lastName}
                    </td>
                    <td>{student.enrollmentNo}</td>
                    <td>{formatSemesterLabel(student.semester)}</td>
                    <td>{student.branchId?.name}</td>
                    <td>{getAcademicClassLabel(student.classId)}</td>
                    <td>{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {showModal && selectedStudent ? (
        <div className="modal-backdrop">
          <div className="modal-card max-w-5xl">
            <div className="modal-header">
              <div>
                <h2 className="section-title">{selectedStudentName || "Details"}</h2>
                <p className="section-subtitle">
                  Consultez les informations personnelles, academiques et la
                  synthese de moyenne de l'etudiant.
                </p>
              </div>
              <CustomButton
                onClick={() => setShowModal(false)}
                variant="secondary"
                className="!rounded-xl !p-2.5"
              >
                <svg
                  className="h-6 w-6"
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

            <div className="modal-body space-y-6">
              <SectionCard className="overflow-hidden px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <img
                      src={`${process.env.REACT_APP_MEDIA_LINK}/${selectedStudent.profile}`}
                      alt={selectedStudentName || "Etudiant"}
                      className="h-28 w-28 rounded-[28px] object-cover ring-4 ring-blue-100"
                      onError={(event) => {
                        event.target.src = FALLBACK_IMAGE;
                      }}
                    />
                    <div>
                      <p className="section-kicker">Fiche etudiant</p>
                      <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                        {selectedStudentName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {selectedStudent.email}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <StatusBadge tone="primary">
                          {formatSemesterLabel(selectedStudent.semester)}
                        </StatusBadge>
                        <StatusBadge tone="neutral">
                          {getAcademicClassLabel(selectedStudent.classId)}
                        </StatusBadge>
                        <StatusBadge tone="success">
                          {selectedStudent.branchId?.name || "Sans filiere"}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="metric-card metric-card-primary">
                      <p className="metric-label text-blue-700">Moyenne generale</p>
                      <p className="metric-value">
                        {formatAverage(selectedStudentSummary?.overallAverage)}
                      </p>
                    </div>
                    <div className="metric-card metric-card-success">
                      <p className="metric-label text-emerald-700">
                        Moyenne semestre
                      </p>
                      <p className="metric-value">
                        {formatAverage(
                          selectedStudentSummary?.semesterAverages?.[0]?.average
                        )}
                      </p>
                    </div>
                    <div className="metric-card metric-card-warning">
                      <p className="metric-label text-amber-700">
                        Matieres
                      </p>
                      <p className="metric-value">
                        {selectedStudentSummary?.subjectCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard className="px-6 py-6 sm:px-8">
                  <div className="section-header">
                    <p className="section-kicker">Identite</p>
                    <h3 className="section-title">Informations personnelles</h3>
                  </div>
                  <div className="mt-5 info-grid-2">
                    <InfoItem label="Nom complet" value={selectedStudentName} />
                    <InfoItem
                      label="Genre"
                      value={getGenderLabel(selectedStudent.gender)}
                    />
                    <InfoItem
                      label="Date de naissance"
                      value={formatLongDate(selectedStudent.dob)}
                    />
                    <InfoItem
                      label="Groupe sanguin"
                      value={selectedStudent.bloodGroup}
                    />
                  </div>
                </SectionCard>

                <SectionCard className="px-6 py-6 sm:px-8">
                  <div className="section-header">
                    <p className="section-kicker">Academique</p>
                    <h3 className="section-title">Affectation</h3>
                  </div>
                  <div className="mt-5 info-grid-2">
                    <InfoItem
                      label="No inscription"
                      value={selectedStudent.enrollmentNo}
                    />
                    <InfoItem
                      label="Filiere"
                      value={selectedStudent.branchId?.name}
                    />
                    <InfoItem
                      label="Semestre"
                      value={formatSemesterLabel(selectedStudent.semester)}
                    />
                    <InfoItem
                      label="Classe"
                      value={getAcademicClassLabel(selectedStudent.classId)}
                    />
                    <InfoItem
                      label="Annee academique"
                      value={selectedStudent.academicYearId?.name}
                    />
                    <InfoItem
                      label="Promotion"
                      value={selectedStudent.promotionId?.name}
                    />
                  </div>
                </SectionCard>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard className="px-6 py-6 sm:px-8">
                  <div className="section-header">
                    <p className="section-kicker">Coordonnees</p>
                    <h3 className="section-title">Contact</h3>
                  </div>
                  <div className="mt-5 info-grid-2">
                    <InfoItem label="E-mail" value={selectedStudent.email} />
                    <InfoItem label="Telephone" value={selectedStudent.phone} />
                    <InfoItem
                      label="Departement"
                      value={selectedStudent.departmentId?.name}
                    />
                    <InfoItem label="Adresse" value={selectedStudent.address} />
                  </div>
                </SectionCard>

                <SectionCard className="px-6 py-6 sm:px-8">
                  <div className="section-header">
                    <p className="section-kicker">Localisation</p>
                    <h3 className="section-title">Residence</h3>
                  </div>
                  <div className="mt-5 info-grid-2">
                    <InfoItem label="Ville" value={selectedStudent.city} />
                    <InfoItem label="Region" value={selectedStudent.state} />
                    <InfoItem
                      label="Code postal"
                      value={selectedStudent.pincode}
                    />
                    <InfoItem
                      label="Pays"
                      value={selectedStudent.country || getDefaultCountryLabel()}
                    />
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentFinder;
