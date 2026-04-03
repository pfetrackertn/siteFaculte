export const getUserTypeLabel = (userType) => {
  const labels = {
    Student: "Etudiant",
    Faculty: "Enseignant",
    Admin: "Administrateur",
  };

  return labels[userType] || userType;
};

export const getGenderLabel = (gender) => {
  const labels = {
    male: "Homme",
    female: "Femme",
    other: "Autre",
  };

  return labels[gender] || gender;
};

export const getStatusLabel = (status) => {
  const labels = {
    active: "Actif",
    inactive: "Inactif",
  };

  return labels[status] || status;
};

export const getMaterialTypeLabel = (type) => {
  const labels = {
    notes: "Notes de cours",
    assignment: "Devoir",
    syllabus: "Programme",
    other: "Autre",
  };

  return labels[type] || type;
};

export const getNoticeAudienceLabel = (type) => {
  const labels = {
    student: "Etudiants",
    faculty: "Enseignants",
    both: "Tous",
  };

  return labels[type] || type;
};

export const getExamTypeLabel = (type) => {
  const labels = {
    mid: "Partiel",
    end: "Examen final",
  };

  return labels[type] || type;
};

export const formatSemesterLabel = (semester) => {
  if (!semester) {
    return "Non renseigne";
  }

  return `Semestre ${semester}`;
};

export const getAcademicClassLabel = (academicClass) => {
  if (!academicClass) {
    return "Non assignee";
  }

  if (typeof academicClass === "string") {
    return academicClass;
  }

  const primaryLabel = academicClass.name || academicClass.code || "Classe";
  const codePart =
    academicClass.code && academicClass.code !== academicClass.name
      ? ` (${academicClass.code})`
      : "";

  return `${primaryLabel}${codePart}`;
};

export const formatLongDate = (dateString) => {
  if (!dateString) {
    return "Non renseigne";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Non renseigne";
  }

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
