const ApiResponse = require("../utils/ApiResponse");
const { normalizeRole, resolveUserRole } = require("../utils/role-resolver");

const attachResolvedUser = async (req, res, next) => {
  try {
    if (!req.userId) {
      return ApiResponse.unauthorized("Authentification requise").send(res);
    }

    if (req.userRole && req.userRecord) {
      return next();
    }

    const resolvedUser = await resolveUserRole(req.userId);

    if (!resolvedUser) {
      return ApiResponse.unauthorized("Utilisateur non autorise").send(res);
    }

    req.userRole = resolvedUser.role;
    req.userTokenRole = resolvedUser.tokenRole;
    req.userRecord = resolvedUser.user;
    return next();
  } catch (error) {
    console.error("Attach Resolved User Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const allowRoles = (...roles) => async (req, res, next) => {
  try {
    await attachResolvedUser(req, res, async () => {
      const allowedRoles = roles.map(normalizeRole);

      if (!allowedRoles.includes(normalizeRole(req.userRole))) {
        return ApiResponse.forbidden("Acces refuse pour ce role").send(res);
      }

      return next();
    });
  } catch (error) {
    console.error("Allow Roles Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  attachResolvedUser,
  allowRoles,
};
