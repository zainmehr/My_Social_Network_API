import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import config from "../config.mjs";
import { validate } from "../middlewares/validate.mjs";
import { makeRateLimiter } from "../middlewares/rateLimit.mjs";
import UserSchema from "../models/user.mjs";

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    avatar: z.string().optional().default(""),
    city: z.string().optional().default("")
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export default class Auth {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    this.User = connect.model("User", UserSchema);

    this.run();
  }

  run() {
    const limiter = makeRateLimiter(config.api.authRateLimit);

    this.app.post(`${config.api.prefix}/auth/register`, limiter, validate(registerSchema), (req, res, next) =>
      this.register(req, res, next)
    );

    this.app.post(`${config.api.prefix}/auth/login`, limiter, validate(loginSchema), (req, res, next) =>
      this.login(req, res, next)
    );
  }

  async register(req, res, next) {
    try {
      const { email, password, firstname, lastname, avatar, city } = req.validated.body;

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await this.User.create({
        email,
        passwordHash,
        firstname,
        lastname,
        avatar,
        city,
        role: "user"
      });

      return res.status(201).json(user.toJSON());
    } catch (e) {
      return next(e);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.validated.body;

      const user = await this.User.findOne({ email });
      if (!user) return res.status(401).json({ code: 401, message: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ code: 401, message: "Invalid credentials" });

      const token = jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      return res.status(200).json({
        token,
        user: user.toJSON()
      });
    } catch (e) {
      return next(e);
    }
  }
}
