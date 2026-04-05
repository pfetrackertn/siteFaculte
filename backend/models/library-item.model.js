const mongoose = require("mongoose");

const libraryItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    file: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    uploadedByRole: {
      type: String,
      enum: ["admin", "faculty", "student"],
      default: "admin",
    },
    visibility: {
      type: String,
      enum: ["all", "student", "faculty", "admin"],
      default: "all",
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

module.exports = mongoose.model("LibraryItem", libraryItemSchema);
