import mongoose from "mongoose";
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    replies: [
      {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const ThreadSchema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    event: { type: Schema.Types.ObjectId, ref: "Event", default: null },
    messages: [MessageSchema]
  },
  { timestamps: true }
);

ThreadSchema.pre("validate", function (next) {
  const hasGroup = !!this.group;
  const hasEvent = !!this.event;
  if (hasGroup === hasEvent) {
    return next(new Error("Thread must be linked to either group OR event (not both)"));
  }
  return next();
});

ThreadSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default ThreadSchema;
