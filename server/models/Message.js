// models/Message.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true },          // <-- String (capital S)
    imageUrl: { type: String },                   // optional
    // add any other fields you actually use…
  },
  { timestamps: true }                            // createdAt/updatedAt auto
);

export default mongoose.model("Message", messageSchema);
