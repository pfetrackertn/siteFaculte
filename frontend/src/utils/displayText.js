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

export const formatLongDate = (dateString) =>
  new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
