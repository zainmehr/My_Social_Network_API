import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { requireAuth } from "../middlewares/auth.mjs";
import PollSchema from "../models/poll.mjs";
import EventSchema from "../models/event.mjs";
const createPollSchema = z.object({
  body: z.object({
    event: z.string().min(1),
    title: z.string().min(1),
    questions: z
      .array(
        z.object({
          question: z.string().min(1),
          options: z.array(z.string().min(1)).min(2)
        })
      )
      .min(1)
  })
});

const answerPollSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    choices: z
      .array(
        z.object({
          questionId: z.string().min(1),
          optionIndex: z.number().int().nonnegative()
        })
      )
      .min(1)
  })
});

export default class Polls {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    this.Poll = connect.model("Poll", PollSchema);
    this.Event = connect.model("Event", EventSchema);

    this.run();
  }

  run() {
    this.app.post(`${config.api.prefix}/polls`, requireAuth, validate(createPollSchema), (req, res, next) =>
      this.create(req, res, next)
    );

    this.app.get(`${config.api.prefix}/polls/:id`, requireAuth, (req, res, next) => this.get(req, res, next));

    this.app.post(
      `${config.api.prefix}/polls/:id/answer`,
      requireAuth,
      validate(answerPollSchema),
      (req, res, next) => this.answer(req, res, next)
    );
  }

  async create(req, res, next) {
    try {
      const { event, title, questions } = req.validated.body;
      const userId = req.auth.sub;

      const ev = await this.Event.findById(event);
      if (!ev) return res.status(404).json({ code: 404, message: "Event not found" });

      // Seuls les organisateurs peuvent créer un sondage
      if (!ev.organisers.map(String).includes(userId)) {
        return res.status(403).json({ code: 403, message: "Only organisers can create polls" });
      }

      const poll = await this.Poll.create({
        event,
        createdBy: userId,
        title,
        questions,
        answers: []
      });

      return res.status(201).json(poll.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async get(req, res, next) {
    try {
      const poll = await this.Poll.findById(req.params.id);
      if (!poll) return res.status(404).json({ code: 404, message: "Poll not found" });
      return res.status(200).json(poll.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async answer(req, res, next) {
    try {
      const pollId = req.validated.params.id;
      const { choices } = req.validated.body;
      const userId = req.auth.sub;

      const poll = await this.Poll.findById(pollId);
      if (!poll) return res.status(404).json({ code: 404, message: "Poll not found" });

      const ev = await this.Event.findById(poll.event);
      if (!ev) return res.status(404).json({ code: 404, message: "Event not found" });

      // Seuls participants peuvent répondre
      if (!ev.participants.map(String).includes(userId)) {
        return res.status(403).json({ code: 403, message: "Only participants can answer polls" });
      }

      // 1 réponse par question (côté payload) + indices valides
      const qIds = new Set(poll.questions.map((q) => q._id.toString()));
      for (const c of choices) {
        if (!qIds.has(c.questionId)) {
          return res.status(400).json({ code: 400, message: "Invalid questionId" });
        }
        const q = poll.questions.id(c.questionId);
        if (!q) return res.status(400).json({ code: 400, message: "Invalid questionId" });
        if (c.optionIndex < 0 || c.optionIndex >= q.options.length) {
          return res.status(400).json({ code: 400, message: "Invalid optionIndex" });
        }
      }

      // Empêche multi-soumissions : 1 answer doc par participant
      const already = poll.answers.find((a) => a.participant.toString() === userId);
      if (already) {
        return res.status(409).json({ code: 409, message: "You already answered this poll" });
      }

      poll.answers.push({ participant: userId, choices });
      await poll.save();

      return res.status(201).json(poll.toJSON());
    } catch (e) {
      return next(e);
    }
  }
}
