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
    archived: "Archive",
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

export const getLmdLevelLabel = (level) => {
  const labels = {
    L1: "Licence 1",
    L2: "Licence 2",
    L3: "Licence 3",
    M1: "Master 1",
    M2: "Master 2",
    D1: "Doctorat 1",
    D2: "Doctorat 2",
    D3: "Doctorat 3",
  };

  return labels[level] || level || "Non renseigne";
};

export const getProgramTypeLabel = (programType) => {
  const labels = {
    licence: "Licence",
    master: "Master",
    doctorat: "Doctorat",
  };

  return labels[programType] || programType || "Non renseigne";
};

export const getVisibilityLabel = (visibility) => {
  const labels = {
    all: "Tous",
    student: "Etudiants",
    faculty: "Enseignants",
    admin: "Administrateurs",
  };

  return labels[visibility] || visibility || "Non renseigne";
};

export const formatAmount = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

export const formatCurrencyCdf = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

export const getDefaultCountryLabel = () => "Republique democratique du Congo";

export const formatAverage = (average) => {
  if (average === null || average === undefined || Number.isNaN(Number(average))) {
    return "Non calculee";
  }

  return `${Number(average).toFixed(2)}/20`;
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
