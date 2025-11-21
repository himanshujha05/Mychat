// lib/db.js
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI (or MONGO_URI) is missing");

  await mongoose.connect(uri, {
    autoIndex: true,
    dbName: "mychat", // <— add this if your URI doesn’t include a db name
  });
}
