import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoose from "mongoose";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import fs from "fs";
import https from "https";

import config from "./config.mjs";
import routes from "./controllers/routes.mjs";
import { makeRateLimiter } from "./middlewares/rateLimit.mjs";
import { notFound, errorHandler } from "./middlewares/errors.mjs";
import { logInfo } from "./utils/logger.mjs";

class Server {
  constructor() {
    this.app = express();
    this.connect = mongoose;
  }

  async dbConnect() {
    await this.connect.connect(config.mongo.uri);
    logInfo("Mongo connected:", config.mongo.uri);
  }

  security() {
    // Cache “x-powered-by”
    this.app.disable("x-powered-by");

    // Headers sécurité
    this.app.use(helmet());

    // Anti NoSQL injection via payload
    this.app.use(mongoSanitize());

    // Logs HTTP (audit)
    this.app.use(morgan("combined"));

    // Rate limit global
    this.app.use(makeRateLimiter(config.api.rateLimit));
  }

  middleware() {
    this.app.use(
      cors({
        origin: (origin, cb) => {
          // autorise curl/postman (no origin) + origins whitelist
          if (!origin) return cb(null, true);
          if (config.api.corsOrigins.includes(origin)) return cb(null, true);
          return cb(new Error("CORS: origin not allowed"), false);
        },
        credentials: false
      })
    );

    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(compression());
  }

  routes() {
    // Health check
    this.app.get(`${config.api.prefix}/health`, (req, res) => res.status(200).json({ ok: true, env: config.env }));

    // Instanciation “style prof”
    new routes.Auth(this.app, this.connect);
    new routes.Users(this.app, this.connect);
    new routes.Groups(this.app, this.connect);
    new routes.Events(this.app, this.connect);
    new routes.Threads(this.app, this.connect);
    new routes.Albums(this.app, this.connect);
    new routes.Polls(this.app, this.connect);
    new routes.Tickets(this.app, this.connect);

    // 404 + handler d’erreur
    this.app.use(notFound);
    this.app.use(errorHandler);
  }

  async run() {
    await this.dbConnect();
    this.security();
    this.middleware();
    this.routes();

    if (config.https.enabled) {
      if (!config.https.keyPath || !config.https.certPath) {
        throw new Error("HTTPS enabled but key/cert paths missing");
      }
      const key = fs.readFileSync(config.https.keyPath);
      const cert = fs.readFileSync(config.https.certPath);
      https.createServer({ key, cert }, this.app).listen(config.api.port, () => {
        logInfo(`HTTPS server listening on https://localhost:${config.api.port}${config.api.prefix}`);
      });
      return;
    }

    this.app.listen(config.api.port, () => {
      logInfo(`HTTP server listening on http://localhost:${config.api.port}${config.api.prefix}`);
    });
  }
}

const server = new Server();
server.run();
