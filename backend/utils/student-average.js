const Marks = require("../models/marks.model");
const StudentDetail = require("../models/details/student-details.model");
const { getArchiveFilter } = require("./archive");

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const buildSemesterBuckets = (marks = []) => {
  const semesterMap = new Map();

  marks.forEach((mark) => {
    const semesterKey = Number(mark.semester);

    if (!semesterMap.has(semesterKey)) {
      semesterMap.set(semesterKey, {
        semester: semesterKey,
        subjects: new Map(),
      });
    }

    const semesterBucket = semesterMap.get(semesterKey);
    const subjectId = mark.subjectId?._id?.toString() || String(mark.subjectId);

    if (!semesterBucket.subjects.has(subjectId)) {
      semesterBucket.subjects.set(subjectId, {
        subjectId,
        subjectName: mark.subjectId?.name || "Matiere",
        subjectCode: mark.subjectId?.code || "",
        credits: Number(mark.subjectId?.credits) || 1,
        exams: [],
      });
    }

    semesterBucket.subjects.get(subjectId).exams.push(mark);
  });

  return semesterMap;
};

const normalizeMarkTo20 = (mark) => {
  const totalMarks = Number(mark.examId?.totalMarks) || 0;

  if (totalMarks <= 0) {
    return 0;
  }

  return (Number(mark.marksObtained) / totalMarks) * 20;
};

const computeStudentAverageSummary = async ({
  studentId,
  semester = null,
} = {}) => {
  const student = await StudentDetail.findById(studentId)
    .select(
      "firstName middleName lastName enrollmentNo semester classId branchId academicYearId"
    )
    .populate("classId", "name code")
    .populate("branchId", "name")
    .populate("academicYearId", "name");

  if (!student) {
    throw new Error("Etudiant introuvable");
  }

  const query = {
    studentId,
    ...getArchiveFilter(),
  };

  if (semester) {
    query.semester = Number(semester);
  }

  const marks = await Marks.find(query)
    .populate("subjectId", "name code credits")
    .populate("examId", "name examType totalMarks")
    .sort({ semester: 1, createdAt: 1 });

  if (!marks.length) {
    return {
      student,
      semesterAverages: [],
      overallAverage: null,
      subjectCount: 0,
      marksCount: 0,
    };
  }

  const semesterBuckets = buildSemesterBuckets(marks);
  const semesterAverages = [];
  let globalWeightedTotal = 0;
  let globalCredits = 0;

  Array.from(semesterBuckets.values())
    .sort((a, b) => a.semester - b.semester)
    .forEach((semesterBucket) => {
      const subjects = Array.from(semesterBucket.subjects.values()).map(
        (subjectBucket) => {
          const normalizedExams = subjectBucket.exams.map((examMark) =>
            normalizeMarkTo20(examMark)
          );
          const subjectAverage = normalizedExams.length
            ? normalizedExams.reduce((sum, value) => sum + value, 0) /
              normalizedExams.length
            : 0;

          return {
            subjectId: subjectBucket.subjectId,
            subjectName: subjectBucket.subjectName,
            subjectCode: subjectBucket.subjectCode,
            credits: subjectBucket.credits,
            examCount: subjectBucket.exams.length,
            average: roundToTwo(subjectAverage),
          };
        }
      );

      const semesterCredits = subjects.reduce(
        (sum, subject) => sum + subject.credits,
        0
      );
      const semesterWeightedTotal = subjects.reduce(
        (sum, subject) => sum + subject.average * subject.credits,
        0
      );
      const semesterAverage = semesterCredits
        ? semesterWeightedTotal / semesterCredits
        : 0;

      semesterAverages.push({
        semester: semesterBucket.semester,
        average: roundToTwo(semesterAverage),
        credits: semesterCredits,
        subjects,
      });

      globalWeightedTotal += semesterWeightedTotal;
      globalCredits += semesterCredits;
    });

  return {
    student,
    semesterAverages,
    overallAverage: globalCredits
      ? roundToTwo(globalWeightedTotal / globalCredits)
      : null,
    subjectCount: semesterAverages.reduce(
      (sum, item) => sum + item.subjects.length,
      0
    ),
    marksCount: marks.length,
  };
};

module.exports = {
  computeStudentAverageSummary,
};
