import mongoose from "mongoose";
const { Schema } = mongoose;

const PollQuestionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    options: [{ type: String, required: true }]
  },
  { _id: true }
);

const PollAnswerSchema = new Schema(
  {
    participant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // 1 réponse par question
    choices: [
      {
        questionId: { type: Schema.Types.ObjectId, required: true },
        optionIndex: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

const PollSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // organisateur
    title: { type: String, required: true, trim: true },
    questions: [PollQuestionSchema],
    answers: [PollAnswerSchema]
  },
  { timestamps: true }
);

PollSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default PollSchema;
