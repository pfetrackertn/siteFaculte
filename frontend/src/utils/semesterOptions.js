const SEMESTERS_BY_CYCLE = {
  licence: [1, 2, 3, 4, 5, 6],
  master: [1, 2, 3, 4],
  doctorat: [1, 2, 3, 4, 5, 6],
};

const DEFAULT_SEMESTERS = SEMESTERS_BY_CYCLE.licence;

const toSemesterArray = (values = []) =>
  [...new Set(values.map(Number).filter((value) => Number.isFinite(value) && value > 0))].sort(
    (first, second) => first - second
  );

export const inferCycle = ({ programType, level, value } = {}) => {
  const candidate = String(programType || level || value || "")
    .trim()
    .toLowerCase();

  if (!candidate) {
    return null;
  }

  if (
    candidate.includes("doctorat") ||
    candidate.includes("doctoral") ||
    candidate.startsWith("d")
  ) {
    return "doctorat";
  }

  if (candidate.includes("master") || candidate.startsWith("m")) {
    return "master";
  }

  if (
    candidate.includes("licence") ||
    candidate.includes("license") ||
    candidate.startsWith("l")
  ) {
    return "licence";
  }

  return null;
};

export const getSemesterOptions = ({
  programType,
  level,
  classItem,
  classes = [],
  currentValue,
} = {}) => {
  const explicitCycle = inferCycle({
    programType: programType || classItem?.programType,
    level: level || classItem?.level,
  });

  const cycleSemesters = explicitCycle
    ? SEMESTERS_BY_CYCLE[explicitCycle] || DEFAULT_SEMESTERS
    : [];

  const classSemesters = toSemesterArray(
    classes.map((academicClass) => academicClass?.semester)
  );

  const merged = toSemesterArray([
    ...(cycleSemesters.length ? cycleSemesters : classSemesters.length ? classSemesters : DEFAULT_SEMESTERS),
    currentValue,
  ]);

  return merged.length ? merged : DEFAULT_SEMESTERS;
};
