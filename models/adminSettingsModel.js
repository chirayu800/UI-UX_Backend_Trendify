import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const adminSettingsModel = mongoose.models.adminsettings || mongoose.model("adminsettings", adminSettingsSchema);

export default adminSettingsModel;

