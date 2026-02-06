import mongoose from "mongoose";
const { Schema } = mongoose;

const PhotoCommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const PhotoSchema = new Schema(
  {
    url: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comments: [PhotoCommentSchema]
  },
  { timestamps: true }
);

const AlbumSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    name: { type: String, required: true, trim: true },
    photos: [PhotoSchema]
  },
  { timestamps: true }
);

AlbumSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default AlbumSchema;
