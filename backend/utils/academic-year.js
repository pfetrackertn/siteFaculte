const AcademicYear = require("../models/academic-year.model");

const getActiveAcademicYear = async () =>
  AcademicYear.findOne({
    isActive: true,
    isArchived: false,
  }).sort({ startDate: -1 });

const resolveAcademicYearId = async (academicYearId = null) => {
  if (academicYearId) {
    return academicYearId;
  }

  const activeAcademicYear = await getActiveAcademicYear();
  return activeAcademicYear?._id || null;
};

const deactivateOtherAcademicYears = async (activeAcademicYearId) => {
  if (!activeAcademicYearId) {
    return;
  }

  await AcademicYear.updateMany(
    {
      _id: { $ne: activeAcademicYearId },
    },
    {
      $set: {
        isActive: false,
      },
    }
  );
};

module.exports = {
  getActiveAcademicYear,
  resolveAcademicYearId,
  deactivateOtherAcademicYears,
};
