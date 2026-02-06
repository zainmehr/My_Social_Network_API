import mongoose from "mongoose";
const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    coverPhoto: { type: String, default: "" },
    visibility: { type: String, enum: ["public", "private"], default: "public" },

    organisers: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],

    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },

    // Billetterie
    ticketingEnabled: { type: Boolean, default: false },

    // BONUS flags
    shoppingListEnabled: { type: Boolean, default: false },
    carpoolEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

EventSchema.pre("validate", function (next) {
  if (this.endDate < this.startDate) {
    return next(new Error("endDate must be >= startDate"));
  }
  return next();
});

EventSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default EventSchema;
