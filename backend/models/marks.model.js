const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicClass",
      default: null,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
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

marksSchema.index(
  { studentId: 1, subjectId: 1, examId: 1, semester: 1 },
  { unique: true }
);

module.exports = mongoose.model("Marks", marksSchema);
