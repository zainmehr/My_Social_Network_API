import mongoose from "mongoose";
const { Schema } = mongoose;

const TicketTypeSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

TicketTypeSchema.index({ event: 1, name: 1 }, { unique: true });

const TicketSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    ticketType: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },

    buyer: {
      firstname: { type: String, required: true, trim: true },
      lastname: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true }
    },

    purchasedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// “Une personne extérieure peut obtenir 1 seul billet” -> on impose une unicité par event + identité
TicketSchema.index(
  { event: 1, "buyer.firstname": 1, "buyer.lastname": 1, "buyer.address": 1 },
  { unique: true }
);

function toJsonClean(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

TicketTypeSchema.set("toJSON", { transform: toJsonClean });
TicketSchema.set("toJSON", { transform: toJsonClean });

export { TicketTypeSchema, TicketSchema };
