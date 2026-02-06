import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { requireAuth } from "../middlewares/auth.mjs";
import GroupSchema from "../models/group.mjs";
const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional().default(""),
    icon: z.string().optional().default(""),
    coverPhoto: z.string().optional().default(""),
    type: z.enum(["public", "private", "secret"]).default("public"),
    allowMemberPosts: z.boolean().default(true),
    allowMemberCreateEvents: z.boolean().default(false),
    members: z.array(z.string()).optional().default([])
  })
});

const idSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export default class Groups {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    this.Group = connect.model("Group", GroupSchema);

    this.run();
  }

  run() {
    this.app.post(`${config.api.prefix}/groups`, requireAuth, validate(createGroupSchema), (req, res, next) =>
      this.create(req, res, next)
    );

    this.app.get(`${config.api.prefix}/groups/:id`, requireAuth, validate(idSchema), (req, res, next) =>
      this.getById(req, res, next)
    );

    this.app.post(`${config.api.prefix}/groups/:id/join`, requireAuth, validate(idSchema), (req, res, next) =>
      this.join(req, res, next)
    );

    this.app.post(`${config.api.prefix}/groups/:id/leave`, requireAuth, validate(idSchema), (req, res, next) =>
      this.leave(req, res, next)
    );
  }

  async create(req, res, next) {
    try {
      const b = req.validated.body;
      const creatorId = req.auth.sub;

      const group = await this.Group.create({
        ...b,
        admins: [creatorId],
        members: Array.from(new Set([creatorId, ...b.members]))
      });

      return res.status(201).json(group.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.validated.params;
      const group = await this.Group.findById(id);
      if (!group) return res.status(404).json({ code: 404, message: "Group not found" });
      return res.status(200).json(group.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async join(req, res, next) {
    try {
      const { id } = req.validated.params;
      const userId = req.auth.sub;

      const group = await this.Group.findById(id);
      if (!group) return res.status(404).json({ code: 404, message: "Group not found" });

      group.members = Array.from(new Set([...group.members.map(String), userId])).map((x) => x);
      await group.save();

      return res.status(200).json(group.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async leave(req, res, next) {
    try {
      const { id } = req.validated.params;
      const userId = req.auth.sub;

      const group = await this.Group.findById(id);
      if (!group) return res.status(404).json({ code: 404, message: "Group not found" });

      group.members = group.members.filter((m) => m.toString() !== userId);
      group.admins = group.admins.filter((a) => a.toString() !== userId);

      // Empêche un groupe sans admin
      if (group.admins.length === 0) {
        return res.status(409).json({ code: 409, message: "Group must have at least one admin" });
      }

      await group.save();
      return res.status(200).json(group.toJSON());
    } catch (e) {
      return next(e);
    }
  }
}
