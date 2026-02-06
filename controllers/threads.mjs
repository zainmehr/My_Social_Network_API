import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { requireAuth } from "../middlewares/auth.mjs";
import ThreadSchema from "../models/threads.mjs";

const createThreadSchema = z.object({
  body: z.object({
    group: z.string().nullable().optional().default(null),
    event: z.string().nullable().optional().default(null)
  })
});

const postMessageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ text: z.string().min(1).max(2000) })
});

const replySchema = z.object({
  params: z.object({ id: z.string().min(1), messageId: z.string().min(1) }),
  body: z.object({ text: z.string().min(1).max(2000) })
});

export default class Threads {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    this.Thread = connect.model("Thread", ThreadSchema);

    this.run();
  }

  run() {
    this.app.post(`${config.api.prefix}/threads`, requireAuth, validate(createThreadSchema), (req, res, next) =>
      this.create(req, res, next)
    );

    this.app.get(`${config.api.prefix}/threads/:id`, requireAuth, (req, res, next) => this.get(req, res, next));

    this.app.post(
      `${config.api.prefix}/threads/:id/messages`,
      requireAuth,
      validate(postMessageSchema),
      (req, res, next) => this.addMessage(req, res, next)
    );

    this.app.post(
      `${config.api.prefix}/threads/:id/messages/:messageId/replies`,
      requireAuth,
      validate(replySchema),
      (req, res, next) => this.reply(req, res, next)
    );
  }

  async create(req, res, next) {
    try {
      const { group, event } = req.validated.body;

      const thread = await this.Thread.create({
        group,
        event,
        messages: []
      });

      return res.status(201).json(thread.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async get(req, res, next) {
    try {
      const thread = await this.Thread.findById(req.params.id);
      if (!thread) return res.status(404).json({ code: 404, message: "Thread not found" });
      return res.status(200).json(thread.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async addMessage(req, res, next) {
    try {
      const { id } = req.validated.params;
      const { text } = req.validated.body;

      const thread = await this.Thread.findById(id);
      if (!thread) return res.status(404).json({ code: 404, message: "Thread not found" });

      thread.messages.push({ author: req.auth.sub, text, replies: [] });
      await thread.save();

      return res.status(201).json(thread.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async reply(req, res, next) {
    try {
      const { id, messageId } = req.validated.params;
      const { text } = req.validated.body;

      const thread = await this.Thread.findById(id);
      if (!thread) return res.status(404).json({ code: 404, message: "Thread not found" });

      const msg = thread.messages.id(messageId);
      if (!msg) return res.status(404).json({ code: 404, message: "Message not found" });

      msg.replies.push({ author: req.auth.sub, text });
      await thread.save();

      return res.status(201).json(thread.toJSON());
    } catch (e) {
      return next(e);
    }
  }
}
