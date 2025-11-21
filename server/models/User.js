// models/User.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    bio:      { type: String },
    avatar:   { type: String },
  },
  { timestamps: true }
);

// IMPORTANT: prevent OverwriteModelError on reload
export default mongoose.models.User || mongoose.model("User", userSchema);
