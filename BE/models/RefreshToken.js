import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  userAgent: { type: String },
  ipAddress: { type: String },
});

export default mongoose.model("RefreshToken", refreshTokenSchema);
