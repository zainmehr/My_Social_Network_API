import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { requireAuth } from "../middlewares/auth.mjs";
import EventSchema from "../models/event.mjs";

const createEventSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional().default(""),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    location: z.string().min(1),
    coverPhoto: z.string().optional().default(""),
    visibility: z.enum(["public", "private"]).default("public"),
    organisers: z.array(z.string()).optional().default([]),
    participants: z.array(z.string()).optional().default([]),

    group: z.string().nullable().optional().default(null),

    ticketingEnabled: z.boolean().optional().default(false),
    shoppingListEnabled: z.boolean().optional().default(false),
    carpoolEnabled: z.boolean().optional().default(false)
  })
});

const idSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export default class Events {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    this.Event = connect.model("Event", EventSchema);

    this.run();
  }

  run() {
    this.app.post(`${config.api.prefix}/events`, requireAuth, validate(createEventSchema), (req, res, next) =>
      this.create(req, res, next)
    );

    this.app.get(`${config.api.prefix}/events/:id`, requireAuth, validate(idSchema), (req, res, next) =>
      this.getById(req, res, next)
    );

    this.app.post(`${config.api.prefix}/events/:id/join`, requireAuth, validate(idSchema), (req, res, next) =>
      this.join(req, res, next)
    );

    this.app.post(`${config.api.prefix}/events/:id/leave`, requireAuth, validate(idSchema), (req, res, next) =>
      this.leave(req, res, next)
    );
  }

  async create(req, res, next) {
    try {
      const b = req.validated.body;
      const creatorId = req.auth.sub;

      const organisers = Array.from(new Set([creatorId, ...b.organisers]));
      const participants = Array.from(new Set([creatorId, ...b.participants]));

      const event = await this.Event.create({
        ...b,
        organisers,
        participants
      });

      return res.status(201).json(event.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.validated.params;
      const event = await this.Event.findById(id);
      if (!event) return res.status(404).json({ code: 404, message: "Event not found" });
      return res.status(200).json(event.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async join(req, res, next) {
    try {
      const { id } = req.validated.params;
      const userId = req.auth.sub;

      const event = await this.Event.findById(id);
      if (!event) return res.status(404).json({ code: 404, message: "Event not found" });

      event.participants = Array.from(new Set([...event.participants.map(String), userId]));
      await event.save();

      return res.status(200).json(event.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async leave(req, res, next) {
    try {
      const { id } = req.validated.params;
      const userId = req.auth.sub;

      const event = await this.Event.findById(id);
      if (!event) return res.status(404).json({ code: 404, message: "Event not found" });

      event.participants = event.participants.filter((p) => p.toString() !== userId);
      event.organisers = event.organisers.filter((o) => o.toString() !== userId);

      if (event.organisers.length === 0) {
        return res.status(409).json({ code: 409, message: "Event must have at least one organiser" });
      }

      await event.save();
      return res.status(200).json(event.toJSON());
    } catch (e) {
      return next(e);
    }
  }
}
