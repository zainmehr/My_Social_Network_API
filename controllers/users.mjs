import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import UserSchema from "../models/user.mjs";


const getByIdSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});

export default class Users {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    this.User = connect.model("User", UserSchema);

    this.run();
  }

  run() {
    // Lire un user (auth requis)
    this.app.get(`${config.api.prefix}/users/:id`, requireAuth, validate(getByIdSchema), (req, res, next) =>
      this.getById(req, res, next)
    );

    // Supprimer un user (admin)
    this.app.delete(
      `${config.api.prefix}/users/:id`,
      requireAuth,
      requireRole("admin"),
      validate(getByIdSchema),
      (req, res, next) => this.deleteById(req, res, next)
    );

    // Moi
    this.app.get(`${config.api.prefix}/me`, requireAuth, (req, res, next) => this.me(req, res, next));
  }

  async me(req, res, next) {
    try {
      const user = await this.User.findById(req.auth.sub);
      if (!user) return res.status(404).json({ code: 404, message: "User not found" });
      return res.status(200).json(user.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.validated.params;
      const user = await this.User.findById(id);
      if (!user) return res.status(404).json({ code: 404, message: "User not found" });
      return res.status(200).json(user.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async deleteById(req, res, next) {
    try {
      const { id } = req.validated.params;
      const deleted = await this.User.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ code: 404, message: "User not found" });
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  }
}
