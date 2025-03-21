const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isPrivate: { type: Boolean, default: false },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["admin", "member"], default: "member" }
    }
  ],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // 🔹 Users waiting for approval

  sharedResources: [
    {
      title: { type: String, required: true }, // 🔹 Name of the resource
      type: { type: String, enum: ["pdf", "link", "note"], required: true }, // 🔹 Type of resource
      url: { type: String }, // 🔹 URL for PDFs or external links
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 🔹 User who uploaded
      createdAt: { type: Date, default: Date.now } // 🔹 Timestamp
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Group", GroupSchema);
