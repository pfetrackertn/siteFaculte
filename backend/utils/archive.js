const isTruthyFlag = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes"].includes(String(value).toLowerCase());
};

const getArchiveFilter = ({
  includeArchived = false,
  archivedOnly = false,
} = {}) => {
  if (isTruthyFlag(archivedOnly)) {
    return { isArchived: true };
  }

  if (isTruthyFlag(includeArchived)) {
    return {};
  }

  return { isArchived: { $ne: true } };
};

const buildArchiveUpdate = (archive = true, archiveReason = "") => {
  if (archive) {
    return {
      isArchived: true,
      archivedAt: new Date(),
      archiveReason,
    };
  }

  return {
    isArchived: false,
    archivedAt: null,
    archiveReason: "",
  };
};

module.exports = {
  isTruthyFlag,
  getArchiveFilter,
  buildArchiveUpdate,
};
