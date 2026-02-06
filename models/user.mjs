import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    avatar: { type: String, default: "" },
    city: { type: String, default: "" },

    // rôle pour RBAC
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);


// JSON propre: id au lieu de _id + pas de passwordHash
UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});

export default UserSchema;
