const AdminDetail = require("../models/details/admin-details.model");
const FacultyDetail = require("../models/details/faculty-details.model");
const StudentDetail = require("../models/details/student-details.model");

const ROLE_MAPPINGS = [
  {
    role: "admin",
    model: AdminDetail,
    tokenRole: "Admin",
  },
  {
    role: "faculty",
    model: FacultyDetail,
    tokenRole: "Faculty",
  },
  {
    role: "student",
    model: StudentDetail,
    tokenRole: "Student",
  },
];

const normalizeRole = (role = "") => String(role).trim().toLowerCase();

const resolveUserRole = async (userId) => {
  for (const mapping of ROLE_MAPPINGS) {
    const user = await mapping.model.findById(userId);

    if (user) {
      return {
        role: mapping.role,
        tokenRole: mapping.tokenRole,
        user,
      };
    }
  }

  return null;
};

module.exports = {
  normalizeRole,
  resolveUserRole,
};
