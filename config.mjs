import dotenv from "dotenv";
dotenv.config();

const env = process.argv[2] || "development";

const base = {
  env,
  api: {
    prefix: "/api/v1",
    port: Number(process.env.PORT || 3000),
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    rateLimit: {
      windowMs: 60_000,
      max: 200
    },
    authRateLimit: {
      windowMs: 60_000,
      max: 30
    }
  },
  mongo: {
    uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/my_social_networks"
  },
  jwt: {
    secret: process.env.JWT_SECRET || "CHANGE_ME_DEV_SECRET",
    expiresIn: process.env.JWT_EXPIRES_IN || "2h"
  },
  https: {
    enabled: process.env.HTTPS_ENABLED === "true",
    keyPath: process.env.HTTPS_KEY_PATH || "",
    certPath: process.env.HTTPS_CERT_PATH || ""
  }
};

const configs = {
  development: {
    ...base
  },
  production: {
    ...base,
    jwt: {
      ...base.jwt,
      // En prod, impose un secret fort via env
      secret: process.env.JWT_SECRET
    }
  }
};

export default configs[env] || configs.development;
