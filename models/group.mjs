import mongoose from "mongoose";
const { Schema } = mongoose;

const GroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },
    type: { type: String, enum: ["public", "private", "secret"], default: "public" },

    allowMemberPosts: { type: Boolean, default: true },
    allowMemberCreateEvents: { type: Boolean, default: false },

    admins: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

GroupSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default GroupSchema;
