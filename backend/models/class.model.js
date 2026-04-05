const mongoose = require("mongoose");

const academicClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
    level: {
      type: String,
      enum: ["L1", "L2", "L3", "M1", "M2"],
      default: "L1",
    },
    programType: {
      type: String,
      enum: ["licence", "master"],
      default: "licence",
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archiveReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

academicClassSchema.index(
  { name: 1, branchId: 1, semester: 1, academicYearId: 1 },
  { unique: true }
);

module.exports = mongoose.model("AcademicClass", academicClassSchema);
